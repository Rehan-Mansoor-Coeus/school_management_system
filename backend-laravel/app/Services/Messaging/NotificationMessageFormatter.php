<?php

namespace App\Services\Messaging;

/**
 * Shared modern layout for WhatsApp / email / in-app notification bodies.
 *
 * WhatsApp does not support custom font sizes; readability comes from clear
 * hierarchy, spacing, and bold labels.
 */
class NotificationMessageFormatter
{
    public const BRAND = 'Okusoma';

    public const RULE = '────────────────────';

    /**
     * Build a structured notification message.
     *
     * @param  string  $header  Uppercase title, e.g. APPLICATION RECEIVED
     * @param  string|null  $greeting  e.g. Hello *Nasrah*,
     * @param  array<int, string|array{label?:string,value?:string}|null>  $lines
     * @param  string|null  $institution  Institution display name
     */
    public function format(
        string $header,
        ?string $greeting = null,
        array $lines = [],
        ?string $institution = null
    ): string {
        $parts = [];
        $parts[] = '*'.self::BRAND.'*';
        $parts[] = self::RULE;
        $parts[] = '';

        $header = trim($header);
        if ($header !== '') {
            $parts[] = '*'.mb_strtoupper($header).'*';
            $parts[] = '';
        }

        $institution = trim((string) $institution);
        if ($institution !== '') {
            $parts[] = '*'.$institution.'*';
            $parts[] = '';
        }

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
                $label = trim((string) ($line['label'] ?? ''));
                $value = trim((string) ($line['value'] ?? ''));
                if ($label !== '' && $value !== '') {
                    $bodyLines[] = '*'.$label.'*';
                    $bodyLines[] = $value;
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

            // Promote "*Label:* value" into stacked label/value for readability.
            if (preg_match('/^\*(.+?):\*\s*(.+)$/u', $text, $m)) {
                $bodyLines[] = '*'.trim($m[1]).'*';
                $bodyLines[] = trim($m[2]);
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
        if ($institution !== '') {
            $parts[] = '_'.$institution.'_';
        }
        $parts[] = '_'.self::BRAND.'_';

        return implode("\n", $parts);
    }

    /**
     * Wrap free-form content with Okusoma branding (and optional institution).
     */
    public function wrap(string $body, ?string $header = null, ?string $institution = null): string
    {
        $body = trim($body);
        if ($body === '') {
            return $this->format((string) $header, null, [], $institution);
        }

        // Avoid double-wrapping messages that already use this layout.
        if ($this->isBranded($body)) {
            return $body;
        }

        return $this->format((string) $header, null, [$body], $institution);
    }

    /**
     * Append a light brand/institution footer to user-authored content
     * (announcements, letter captions) without rewriting the body.
     */
    public function appendBrand(string $body, ?string $institution = null): string
    {
        $body = rtrim($body);
        if ($body === '' || $this->isBranded($body)) {
            return $body;
        }

        $footer = [self::RULE];
        $institution = trim((string) $institution);
        if ($institution !== '') {
            $footer[] = '_'.$institution.'_';
        }
        $footer[] = '_'.self::BRAND.'_';

        return $body."\n\n".implode("\n", $footer);
    }

    public function isBranded(string $body): bool
    {
        return strpos($body, '*'.self::BRAND.'*') !== false
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
     * @return array{label:string,value:string}
     */
    public function field(string $label, string $value): array
    {
        return [
            'label' => $label,
            'value' => $value,
        ];
    }
}
