<?php

namespace App\Services\Letters;

use App\Letter;
use App\LetterSetting;
use App\LetterStatusHistory;
use Illuminate\Support\Str;

class LetterWorkflowService
{
    public function generateReference($institutionId)
    {
        $settings = LetterSetting::firstOrCreate(
            ['institution_id' => $institutionId],
            ['serial_prefix' => 'LTR-', 'serial_counter' => 0]
        );

        $settings->serial_counter = (int) $settings->serial_counter + 1;
        $settings->save();

        $prefix = trim((string) $settings->serial_prefix) ?: 'LTR-';
        $counter = str_pad((string) $settings->serial_counter, 6, '0', STR_PAD_LEFT);

        return rtrim($prefix, '-').'-'.$counter;
    }

    public function transition(Letter $letter, $toStatus, $userId = null, $note = null)
    {
        $from = $letter->status;
        $letter->status = $toStatus;

        if ($toStatus === 'sent') {
            $letter->sent_at = now();
        }

        $letter->save();

        LetterStatusHistory::create([
            'institution_id' => $letter->institution_id,
            'letter_id' => $letter->id,
            'user_id' => $userId,
            'from_status' => $from,
            'to_status' => $toStatus,
            'note' => $note,
        ]);

        return $letter->fresh();
    }

    public function personalize($template, array $data)
    {
        $replacements = [
            '{name}' => $data['name'] ?? '',
            '[name]' => $data['name'] ?? '',
            '{phone_number}' => $data['phone'] ?? ($data['phone_number'] ?? ''),
            '[phone_number]' => $data['phone'] ?? ($data['phone_number'] ?? ''),
            '{phone}' => $data['phone'] ?? ($data['phone_number'] ?? ''),
            '[phone]' => $data['phone'] ?? ($data['phone_number'] ?? ''),
            '{email}' => $data['email'] ?? '',
            '[email]' => $data['email'] ?? '',
            '{address}' => $data['address'] ?? '',
            '[address]' => $data['address'] ?? '',
            '{institution_name}' => $data['institution_name'] ?? '',
            '[institution_name]' => $data['institution_name'] ?? '',
            '{reference}' => $data['reference'] ?? '',
            '[reference]' => $data['reference'] ?? '',
            '{date}' => $data['date'] ?? now()->format('M d, Y'),
            '[date]' => $data['date'] ?? now()->format('M d, Y'),
        ];

        for ($i = 1; $i <= 10; $i++) {
            $replacements['{column'.$i.'}'] = $data['column'.$i] ?? '';
            $replacements['[column'.$i.']'] = $data['column'.$i] ?? '';
        }

        return strtr((string) $template, $replacements);
    }

    public function securityCodes(Letter $letter)
    {
        $value = $letter->reference ?: ('LTR-'.$letter->id);
        $letter->barcode_value = $value;
        $letter->qr_code_value = $value.'|'.Str::upper(Str::random(8));
        $letter->save();

        return $letter;
    }
}
