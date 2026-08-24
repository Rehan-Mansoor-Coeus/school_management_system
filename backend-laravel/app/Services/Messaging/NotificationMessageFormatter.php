<?php

namespace App\Services\Messaging;

/**
 * Shared WhatsApp / email / in-app layout (Mulema-style).
 *
 * Title: {Institution} | {Subject}
 * Fields: ▫️ Label: *value*
 */
class NotificationMessageFormatter
{
    public const BRAND = 'Okusoma';

    public const RULE = '────────────────────';

    /**
     * Build a structured notification message.
     *
     * @param  string  $header  Subject, e.g. APPLICATION RECEIVED
     * @param  string|null  $greeting  e.g. Hello *Nasrah*,
     * @param  array<int, string|array{label?:string,value?:string,emoji?:string,action?:string}|null>  $lines
     * @param  string|null  $institution  Institution display name
     * @param  string|null  $emoji  Title emoji; inferred from the subject when omitted
     */
    public function format(
        string $header,
        ?string $greeting = null,
        array $lines = [],
        ?string $institution = null,
        ?string $emoji = null
    ): string {
        $parts = [];
        $titleEmoji = $emoji !== null && $emoji !== '' ? $emoji : $this->emojiForHeader($header);
        $title = $this->title($header, $institution);

        $parts[] = $titleEmoji.' *'.$title.'*';
        $parts[] = self::RULE;
        $parts[] = '';

        $greeting = trim((string) $greeting);
        if ($greeting !== '') {
            $parts[] = $greeting;
            $parts[] = '';
        }

        $bodyLines = [];
        foreach ($lines as $line) {
            if ($line === null || $line === '') {
                continue;
            }

            if (is_array($line)) {
                if (! empty($line['action'])) {
                    $bodyLines[] = '👉 '.trim((string) $line['action']);
                    $bodyLines[] = '';
                    continue;
                }

                $label = trim((string) ($line['label'] ?? ''));
                $value = trim((string) ($line['value'] ?? ''));
                $bullet = trim((string) ($line['emoji'] ?? '▫️'));
                if ($bullet === '') {
                    $bullet = '▫️';
                }

                if ($label !== '' && $value !== '') {
                    $bodyLines[] = $bullet.' '.$label.': *'.$this->stripWrappingBold($value).'*';
                    $bodyLines[] = '';
                } elseif ($value !== '') {
                    $bodyLines[] = $value;
                    $bodyLines[] = '';
                }
                continue;
            }

            $text = trim((string) $line);
            if ($text === '') {
                continue;
            }

            if (preg_match('/^\*(.+?):\*\s*(.+)$/u', $text, $m)) {
                $bodyLines[] = '▫️ '.trim($m[1]).': *'.$this->stripWrappingBold(trim($m[2])).'*';
                $bodyLines[] = '';
                continue;
            }

            $bodyLines[] = $text;
            $bodyLines[] = '';
        }

        while (! empty($bodyLines) && end($bodyLines) === '') {
            array_pop($bodyLines);
        }

        if (! empty($bodyLines)) {
            foreach ($bodyLines as $bodyLine) {
                $parts[] = $bodyLine;
            }
            $parts[] = '';
        }

        $parts[] = self::RULE;
        $parts[] = '🌐 '.self::BRAND;

        return implode("\n", $parts);
    }

    /**
     * Display title: Institution | Subject
     */
    public function title(string $header, ?string $institution = null): string
    {
        $subject = $this->displaySubject($header);
        $institution = trim((string) $institution);

        if ($institution !== '' && $subject !== '') {
            return $institution.' | '.$subject;
        }

        return $institution !== '' ? $institution : $subject;
    }

    /**
     * Wrap free-form content with the branded layout.
     */
    public function wrap(string $body, ?string $header = null, ?string $institution = null): string
    {
        $body = trim($body);
        if ($body === '') {
            return $this->format((string) $header, null, [], $institution);
        }

        if ($this->isBranded($body)) {
            return $body;
        }

        return $this->format((string) $header, null, [$body], $institution);
    }

    /**
     * Append a light brand footer to user-authored content.
     */
    public function appendBrand(string $body, ?string $institution = null): string
    {
        $body = rtrim($body);
        if ($body === '' || $this->isBranded($body)) {
            return $body;
        }

        return $body."\n\n".self::RULE."\n🌐 ".self::BRAND;
    }

    public function isBranded(string $body): bool
    {
        return strpos($body, '🌐 '.self::BRAND) !== false
            || strpos($body, '*'.self::BRAND.'*') !== false
            || strpos($body, '_'.self::BRAND.'_') !== false;
    }

    public function greeting(?string $name): string
    {
        $name = trim((string) $name);
        if ($name === '') {
            return 'Hello,';
        }

        return 'Hello *'.$name.'*,';
    }

    /**
     * @return array{label:string,value:string,emoji:string}
     */
    public function field(string $label, string $value, string $emoji = '▫️'): array
    {
        return [
            'label' => $label,
            'value' => $value,
            'emoji' => $emoji,
        ];
    }

    /**
     * @return array{action:string}
     */
    public function action(string $text): array
    {
        return ['action' => $text];
    }

    public function emojiForHeader(string $header): string
    {
        $h = mb_strtolower(trim($header), 'UTF-8');

        if (preg_match('/otp|verif|username|auth|password|mot de passe/u', $h)) {
            return '🔐';
        }

        if (preg_match('/proof|preuve/u', $h) && preg_match('/reject|rejet/u', $h)) {
            return '⚠️';
        }

        if (preg_match('/proof|preuve/u', $h)) {
            return '🧾';
        }

        if (preg_match('/overdue|reminder|rappel|en retard/u', $h)) {
            return '⏰';
        }

        if (preg_match('/payment|paiement|tuition|scolarité|invoice|facture|fee|frais/u', $h)) {
            return '💳';
        }

        if (preg_match('/admitted|admission|enrolled|inscription|offer|offre/u', $h)) {
            return '🎓';
        }

        if (preg_match('/application|candidature/u', $h) && ! preg_match('/payment|paiement|fee|frais/u', $h)) {
            return '📥';
        }

        if (preg_match('/approved|approuv/u', $h)) {
            return '✅';
        }

        return '📌';
    }

    protected function displaySubject(string $header): string
    {
        $header = trim($header);
        if ($header === '') {
            return '';
        }

        if ($header !== mb_strtoupper($header, 'UTF-8')) {
            return $header;
        }

        return mb_convert_case(mb_strtolower($header, 'UTF-8'), MB_CASE_TITLE, 'UTF-8');
    }

    protected function stripWrappingBold(string $value): string
    {
        if (preg_match('/^\*(.+)\*$/u', $value, $m)) {
            return $m[1];
        }

        return $value;
    }
}
