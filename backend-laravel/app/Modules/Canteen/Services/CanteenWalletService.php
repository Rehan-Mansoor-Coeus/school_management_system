<?php

namespace App\Modules\Canteen\Services;

use App\Modules\Canteen\Models\CanteenWallet;
use App\Modules\Canteen\Models\CanteenWalletTransaction;
use App\Student;
use Illuminate\Support\Str;

class CanteenWalletService
{
    public function ensureWallet(int $institutionId, int $studentId): CanteenWallet
    {
        $wallet = CanteenWallet::where('institution_id', $institutionId)
            ->where('student_id', $studentId)
            ->first();

        if ($wallet) {
            return $wallet;
        }

        return CanteenWallet::create([
            'institution_id' => $institutionId,
            'student_id' => $studentId,
            'wallet_number' => $this->generateWalletNumber($institutionId, $studentId),
            'balance' => 0,
            'total_credit' => 0,
            'total_spent' => 0,
            'credit_limit' => 0,
            'credit_used' => 0,
            'deposit_balance' => 0,
            'is_active' => true,
        ]);
    }

    public function credit(CanteenWallet $wallet, float $amount, string $source, ?string $notes = null, ?int $userId = null): CanteenWalletTransaction
    {
        $wallet->balance = round((float) $wallet->balance + $amount, 2);
        $wallet->total_credit = round((float) $wallet->total_credit + $amount, 2);
        $wallet->save();

        return CanteenWalletTransaction::create([
            'institution_id' => $wallet->institution_id,
            'wallet_id' => $wallet->id,
            'type' => 'credit',
            'amount' => $amount,
            'balance_after' => $wallet->balance,
            'source' => $source,
            'notes' => $notes,
            'created_by' => $userId ?: optional(auth()->user())->id,
        ]);
    }

    public function creditDeposit(CanteenWallet $wallet, float $amount, string $source, ?string $notes = null): CanteenWalletTransaction
    {
        $wallet->deposit_balance = round((float) $wallet->deposit_balance + $amount, 2);
        $wallet->total_credit = round((float) $wallet->total_credit + $amount, 2);
        $wallet->save();

        return CanteenWalletTransaction::create([
            'institution_id' => $wallet->institution_id,
            'wallet_id' => $wallet->id,
            'type' => 'credit',
            'amount' => $amount,
            'balance_after' => (float) $wallet->balance + (float) $wallet->deposit_balance,
            'source' => $source,
            'notes' => $notes,
            'created_by' => optional(auth()->user())->id,
        ]);
    }

    public function debit(CanteenWallet $wallet, float $amount, string $source, ?string $notes = null, ?int $userId = null): CanteenWalletTransaction
    {
        if ((float) $wallet->balance < $amount) {
            throw new \RuntimeException(__('canteen.insufficient_balance'));
        }

        $wallet->balance = round((float) $wallet->balance - $amount, 2);
        $wallet->total_spent = round((float) $wallet->total_spent + $amount, 2);
        $wallet->save();

        return CanteenWalletTransaction::create([
            'institution_id' => $wallet->institution_id,
            'wallet_id' => $wallet->id,
            'type' => 'debit',
            'amount' => $amount,
            'balance_after' => $wallet->balance,
            'source' => $source,
            'notes' => $notes,
            'created_by' => $userId ?: optional(auth()->user())->id,
        ]);
    }

    public function debitDeposit(CanteenWallet $wallet, float $amount, string $source, ?string $notes = null): CanteenWalletTransaction
    {
        $available = (float) $wallet->deposit_balance + (float) $wallet->balance;
        if ($available < $amount) {
            throw new \RuntimeException(__('canteen.insufficient_deposit'));
        }

        $fromDeposit = min((float) $wallet->deposit_balance, $amount);
        $fromBalance = round($amount - $fromDeposit, 2);

        if ($fromDeposit > 0) {
            $wallet->deposit_balance = round((float) $wallet->deposit_balance - $fromDeposit, 2);
        }
        if ($fromBalance > 0) {
            $wallet->balance = round((float) $wallet->balance - $fromBalance, 2);
        }
        $wallet->total_spent = round((float) $wallet->total_spent + $amount, 2);
        $wallet->save();

        return CanteenWalletTransaction::create([
            'institution_id' => $wallet->institution_id,
            'wallet_id' => $wallet->id,
            'type' => 'debit',
            'amount' => $amount,
            'balance_after' => (float) $wallet->balance + (float) $wallet->deposit_balance,
            'source' => $source,
            'notes' => $notes,
            'created_by' => optional(auth()->user())->id,
        ]);
    }

    public function chargeCredit(CanteenWallet $wallet, float $amount, string $source, ?string $notes = null): CanteenWalletTransaction
    {
        $limit = (float) $wallet->credit_limit;
        $used = (float) $wallet->credit_used;
        if ($limit <= 0 || ($used + $amount) > $limit) {
            throw new \RuntimeException(__('canteen.insufficient_credit'));
        }

        $wallet->credit_used = round($used + $amount, 2);
        $wallet->save();

        return CanteenWalletTransaction::create([
            'institution_id' => $wallet->institution_id,
            'wallet_id' => $wallet->id,
            'type' => 'debit',
            'amount' => $amount,
            'balance_after' => (float) $wallet->balance,
            'source' => $source,
            'notes' => $notes,
            'created_by' => optional(auth()->user())->id,
        ]);
    }

    public function recordPayLater(CanteenWallet $wallet, float $amount, string $source, ?string $notes = null): CanteenWalletTransaction
    {
        $wallet->credit_used = round((float) $wallet->credit_used + $amount, 2);
        $wallet->save();

        return CanteenWalletTransaction::create([
            'institution_id' => $wallet->institution_id,
            'wallet_id' => $wallet->id,
            'type' => 'debit',
            'amount' => $amount,
            'balance_after' => (float) $wallet->balance,
            'source' => $source,
            'notes' => $notes,
            'created_by' => optional(auth()->user())->id,
        ]);
    }

    public function resolveStudentByCode(int $institutionId, string $code): ?Student
    {
        $code = trim($code);
        if ($code === '') {
            return null;
        }

        if (Str::startsWith(strtoupper($code), 'CANTEEN:')) {
            $walletNumber = trim(substr($code, 8));
            $wallet = CanteenWallet::where('institution_id', $institutionId)
                ->where('wallet_number', $walletNumber)
                ->first();

            return $wallet ? Student::find($wallet->student_id) : null;
        }

        $wallet = CanteenWallet::where('institution_id', $institutionId)
            ->where('wallet_number', $code)
            ->first();
        if ($wallet) {
            return Student::find($wallet->student_id);
        }

        return Student::where('institution_id', $institutionId)
            ->where('registration_number', $code)
            ->first();
    }

    protected function generateWalletNumber(int $institutionId, int $studentId): string
    {
        do {
            $number = sprintf('CW-%d-%d-%s', $institutionId, $studentId, strtoupper(Str::random(6)));
        } while (CanteenWallet::where('wallet_number', $number)->exists());

        return $number;
    }
}
