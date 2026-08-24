<?php

namespace App\Services\Messaging;

/**
 * Mulema-style WhatsApp / email / in-app layout.
 *
 * *INSTITUTION*
 * ✅ *SUJET FR / SUBJECT EN*
 * ────────────────────
 * Bonjour *NAME*, / Hello *NAME*,
 * ▫️ Libellé / Label: *value*
 * 👉 Suite FR / Next EN
 * 🌐 Okusoma
 */
class NotificationMessageFormatter
{
    public const BRAND = 'Okusoma';

    public const RULE = '────────────────────';

    /**
     * @param  string  $header  English subject
     * @param  string|null  $greeting
     * @param  array<int, string|array|null>  $lines
     * @param  string|null  $institution
     * @param  string|null  $emoji
     * @param  string|null  $headerFr  French subject
     */
    public function format(
        string $header,
        ?string $greeting = null,
        array $lines = [],
        ?string $institution = null,
        ?string $emoji = null,
        ?string $headerFr = null
    ): string {
        $institution = trim((string) $institution);
        $banner = $institution !== '' ? $institution : self::BRAND;
        $titleEmoji = $emoji !== null && $emoji !== '' ? $emoji : $this->emojiForHeader($header.' '.$headerFr);
        $subject = $this->joinLocales(
            $this->statusSubject((string) $headerFr),
            $this->statusSubject($header)
        );

        $parts = [];
        $parts[] = '*'.mb_strtoupper($banner, 'UTF-8').'*';
        if ($subject !== '') {
            $parts[] = $titleEmoji.' *'.$subject.'*';
        }
        $parts[] = self::RULE;
        $parts[] = '';

        $greeting = trim((string) $greeting);
        if ($greeting !== '') {
            $parts[] = $greeting;
            $parts[] = '';
        }

        $summaries = [];
        $fields = [];
        $others = [];
        $actions = [];

        foreach ($lines as $line) {
            if ($line === null || $line === '') {
                continue;
            }

            if (is_array($line)) {
                if (! empty($line['action'])) {
                    $actions[] = '👉 '.$this->joinLocales(
                        (string) ($line['action_fr'] ?? ''),
                        (string) $line['action']
                    );
                    continue;
                }

                if (! empty($line['summary'])) {
                    $summaries[] = $this->joinLocales(
                        (string) ($line['summary_fr'] ?? ''),
                        (string) $line['summary']
                    );
                    continue;
                }

                $label = $this->joinLocales(
                    (string) ($line['label_fr'] ?? ''),
                    (string) ($line['label'] ?? '')
                );
                $value = trim((string) ($line['value'] ?? ''));
                $bullet = trim((string) ($line['emoji'] ?? '▫️'));
                if ($bullet === '') {
                    $bullet = '▫️';
                }

                if ($label !== '' && $value !== '') {
                    $fields[] = $bullet.' '.$label.': *'.$this->stripWrappingBold($value).'*';
                } elseif ($value !== '') {
                    $others[] = $value;
                }
                continue;
            }

            $text = trim((string) $line);
            if ($text === '') {
                continue;
            }

            if (preg_match('/^\*(.+?):\*\s*(.+)$/u', $text, $m)) {
                $fields[] = '▫️ '.trim($m[1]).': *'.$this->stripWrappingBold(trim($m[2])).'*';
                continue;
            }

            $others[] = $text;
        }

        foreach ([$summaries, $others] as $block) {
            if ($block === []) {
                continue;
            }
            foreach ($block as $item) {
                if ($item !== '') {
                    $parts[] = $item;
                }
            }
            $parts[] = '';
        }

        if ($fields !== []) {
            foreach ($fields as $field) {
                $parts[] = $field;
            }
            $parts[] = '';
        }

        if ($actions !== []) {
            foreach ($actions as $action) {
                if ($action !== '👉 ') {
                    $parts[] = $action;
                }
            }
            $parts[] = '';
        }

        while (! empty($parts) && end($parts) === '') {
            array_pop($parts);
        }

        $parts[] = '';
        $parts[] = self::RULE;
        $parts[] = '🌐 '.self::BRAND;

        return implode("\n", $parts);
    }

    /**
     * In-app / email title: Institution | Subject
     */
    public function title(string $header, ?string $institution = null, ?string $headerFr = null): string
    {
        $subject = $this->joinLocales(
            $this->displaySubject((string) $headerFr),
            $this->displaySubject($header)
        );
        $institution = trim((string) $institution);

        if ($institution !== '' && $subject !== '') {
            return $institution.' | '.$subject;
        }

        return $institution !== '' ? $institution : $subject;
    }

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
            return 'Bonjour, / Hello,';
        }

        $bold = '*'.mb_strtoupper($name, 'UTF-8').'*';

        return 'Bonjour '.$bold.', / Hello '.$bold.',';
    }

    /**
     * @return array{label:string,label_fr:string,value:string,emoji:string}
     */
    public function field(string $label, string $value, string $emoji = '▫️', ?string $labelFr = null): array
    {
        return [
            'label' => $label,
            'label_fr' => (string) $labelFr,
            'value' => $value,
            'emoji' => $emoji,
        ];
    }

    /**
     * @return array{summary:string,summary_fr:string}
     */
    public function summary(string $text, ?string $textFr = null): array
    {
        return [
            'summary' => $text,
            'summary_fr' => (string) $textFr,
        ];
    }

    /**
     * @return array{action:string,action_fr:string}
     */
    public function action(string $text, ?string $textFr = null): array
    {
        return [
            'action' => $text,
            'action_fr' => (string) $textFr,
        ];
    }

    public function emojiForHeader(string $header): string
    {
        $h = mb_strtolower(trim($header), 'UTF-8');

        if (preg_match('/otp|verif|username|auth|password|mot de passe|authentification/u', $h)) {
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

        if (preg_match('/payment received|paiement reçu|tuition payment|scolarité reçus|fully paid|verified|confirmé|confirmed/u', $h)) {
            return '✅';
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

    public function joinLocales(?string $french, ?string $english): string
    {
        $french = trim((string) $french);
        $english = trim((string) $english);

        if ($french === '' && $english === '') {
            return '';
        }

        if ($french === '' || $this->samePhrase($french, $english)) {
            return $english !== '' ? $english : $french;
        }

        if ($english === '') {
            return $french;
        }

        return $french.' / '.$english;
    }

    protected function samePhrase(string $left, string $right): bool
    {
        return mb_strtolower($left, 'UTF-8') === mb_strtolower($right, 'UTF-8');
    }

    protected function statusSubject(string $header): string
    {
        $header = trim($header);

        return $header === '' ? '' : mb_strtoupper($header, 'UTF-8');
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
