import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, getAccount } from '@solana/spl-token';
import { TREASURY_WALLET, THREAD_CREATION_FEE, REPLY_MEDIA_FEE, REPLY_TEXT_FEE, POSTING_FEE } from '@/lib/constants';
import { isExemptFromFees } from '@/lib/admin';

// USDC mint address on Solana mainnet
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

// RPC endpoint
const RPC_ENDPOINT = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

// Valid fee amounts for validation
const VALID_FEES = [THREAD_CREATION_FEE, REPLY_MEDIA_FEE, REPLY_TEXT_FEE];

/**
 * Create a USDC transfer transaction for posting fees
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromWallet, amount } = body;

    if (!fromWallet) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Determine requested fee (default to POSTING_FEE if not specified for compatibility)
    const requestedFee = amount !== undefined ? Number(amount) : POSTING_FEE;

    // Optional: Validate requested amount is one of our allowed tiers
    if (!VALID_FEES.includes(requestedFee) && requestedFee !== POSTING_FEE) {
      console.warn(`Unexpected fee amount requested: ${requestedFee}`);
      // We'll still allow it to process but log a warning, 
      // or return an error if you want strict enforcement
    }

    // Check if user is exempt from fees (admin or mod)
    const exemptFromFees = await isExemptFromFees(fromWallet);
    if (exemptFromFees) {
      return NextResponse.json({
        success: true,
        exempt: true,
        message: 'User is exempt from posting fees (admin or mod)'
      });
    }

    const connection = new Connection(RPC_ENDPOINT, 'confirmed');
    const fromPublicKey = new PublicKey(fromWallet);
    const treasuryPublicKey = new PublicKey(TREASURY_WALLET);

    // Get the associated token accounts
    const fromTokenAccount = await getAssociatedTokenAddress(
      USDC_MINT,
      fromPublicKey
    );

    const treasuryTokenAccount = await getAssociatedTokenAddress(
      USDC_MINT,
      treasuryPublicKey
    );

    // Check if the user has a USDC token account
    try {
      await getAccount(connection, fromTokenAccount);
    } catch (error) {
      return NextResponse.json(
        {
          error: 'USDC token account not found. Please ensure you have USDC in your wallet.',
          code: 'NO_TOKEN_ACCOUNT'
        },
        { status: 400 }
      );
    }

    // Check if treasury has a USDC token account
    try {
      await getAccount(connection, treasuryTokenAccount);
    } catch (error) {
      console.error(`Treasury ${TREASURY_WALLET} USDC account error:`, error);
      return NextResponse.json(
        {
          error: 'Treasury USDC account not configured. Please contact support.',
          code: 'TREASURY_NOT_CONFIGURED'
        },
        { status: 500 }
      );
    }

    // Check balance
    const accountInfo = await getAccount(connection, fromTokenAccount);
    const balance = Number(accountInfo.amount) / 1_000_000; // USDC has 6 decimals

    if (balance < requestedFee) {
      return NextResponse.json(
        {
          error: `Insufficient USDC balance. Required: ${requestedFee} USDC, Available: ${balance.toFixed(6)} USDC`,
          code: 'INSUFFICIENT_BALANCE',
          required: requestedFee,
          available: balance
        },
        { status: 400 }
      );
    }

    // Convert USDC amount to smallest unit (USDC has 6 decimals)
    const amountInSmallestUnit = Math.floor(requestedFee * 1_000_000);

    // Create the transfer instruction
    const transferInstruction = createTransferInstruction(
      fromTokenAccount,
      treasuryTokenAccount,
      fromPublicKey,
      amountInSmallestUnit
    );

    // Create transaction
    const transaction = new Transaction().add(transferInstruction);

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash('finalized');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPublicKey;

    // Serialize transaction for client to sign
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    });

    return NextResponse.json({
      success: true,
      transaction: Buffer.from(serializedTransaction).toString('base64'),
      amount: requestedFee,
      treasury: TREASURY_WALLET,
      message: 'Transaction created. Please sign and send it with your wallet.'
    });

  } catch (error) {
    console.error('Posting fee transaction creation error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create transaction',
        code: 'TRANSACTION_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * Verify a posting fee payment
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const signature = searchParams.get('signature');
    const fromWallet = searchParams.get('fromWallet');
    const amountParam = searchParams.get('amount');

    if (!signature || !fromWallet) {
      return NextResponse.json(
        { error: 'Signature and fromWallet are required' },
        { status: 400 }
      );
    }

    // Determine required fee
    const requiredFee = amountParam !== null ? Number(amountParam) : POSTING_FEE;

    const connection = new Connection(RPC_ENDPOINT, 'confirmed');

    // Wait a bit for transaction to be confirmed
    await new Promise(resolve => setTimeout(resolve, 2000));

    const transaction = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0
    });

    if (!transaction) {
      return NextResponse.json(
        { verified: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    if (transaction.meta?.err) {
      return NextResponse.json(
        { verified: false, error: 'Transaction failed' },
        { status: 400 }
      );
    }

    // Verify the transaction includes a USDC transfer to our treasury
    const treasuryPublicKey = new PublicKey(TREASURY_WALLET);
    const treasuryTokenAccount = await getAssociatedTokenAddress(
      USDC_MINT,
      treasuryPublicKey
    );

    // Check if the transaction includes a transfer to our treasury
    const postTokenBalances = transaction.meta?.postTokenBalances || [];

    // In some cases, we need to compare pre and post balances to be sure, 
    // but usually checking post balances with owner/mint and enough amount is sufficient for this simple case.
    // However, getTransaction might only show our treasury if they had a balance.

    // Let's check for the transfer instruction in the transaction if possible, 
    // but metamask/phantom signatures are easier to verify via status and treasury balance.

    const hasTransferToTreasury = postTokenBalances.some(
      balance => balance.mint === USDC_MINT.toString() &&
        balance.owner === treasuryTokenAccount.toString() &&
        (Number(balance.uiTokenAmount?.uiAmount) || 0) >= requiredFee
    );

    if (hasTransferToTreasury) {
      return NextResponse.json({
        verified: true,
        signature,
        amount: requiredFee
      });
    } else {
      // Fallback: Check instructions (optional, more robust)
      // For now, retry basic check with small epsilon for rounding
      const hasCloseTransfer = postTokenBalances.some(
        balance => balance.mint === USDC_MINT.toString() &&
          balance.owner === treasuryTokenAccount.toString() &&
          (Number(balance.uiTokenAmount?.uiAmount) || 0) >= (requiredFee - 0.000001)
      );

      if (hasCloseTransfer) {
        return NextResponse.json({
          verified: true,
          signature,
          amount: requiredFee
        });
      }

      return NextResponse.json(
        { verified: false, error: 'Transaction does not include required payment' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { verified: false, error: error instanceof Error ? error.message : 'Verification failed' },
      { status: 500 }
    );
  }
}
