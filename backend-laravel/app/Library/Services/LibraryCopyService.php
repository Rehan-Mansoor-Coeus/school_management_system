<?php

namespace App\Library\Services;

use App\Library\LibraryBook;
use App\Library\LibraryBookCopy;

class LibraryCopyService
{
    /**
     * Create one or more physical copies for a book.
     * Accession numbers are auto-generated unless a single copy_code is supplied.
     *
     * @return LibraryBookCopy[]
     */
    public function createForBook(
        LibraryBook $book,
        int $quantity,
        array $options = []
    ): array {
        $quantity = max(1, min(100, $quantity));
        $institutionId = (int) $book->institution_id;
        $prefix = $options['accession_prefix'] ?? null;
        $singleCode = $options['copy_code'] ?? null;
        $shelf = $options['shelf_location'] ?? $book->shelf_location;
        $condition = $options['condition'] ?? 'good';
        $status = $options['status'] ?? LibraryBookCopy::STATUS_AVAILABLE;

        $created = [];

        if ($quantity === 1 && $singleCode) {
            $created[] = $this->createOne($book, $singleCode, $shelf, $condition, $status, $options['barcode'] ?? null);

            return $created;
        }

        for ($i = 0; $i < $quantity; $i++) {
            $code = $this->nextAccessionNumber($institutionId, $book->id, $prefix);
            $created[] = $this->createOne($book, $code, $shelf, $condition, $status, $code);
        }

        return $created;
    }

    /**
     * Suggest the next accession number for a book (for display in forms).
     */
    public function suggestNextAccessionNumber(int $institutionId, int $bookId, ?string $prefix = null): string
    {
        return $this->nextAccessionNumber($institutionId, $bookId, $prefix);
    }

    protected function createOne(
        LibraryBook $book,
        string $copyCode,
        ?string $shelf,
        string $condition,
        string $status,
        ?string $barcode
    ): LibraryBookCopy {
        return LibraryBookCopy::create([
            'institution_id' => $book->institution_id,
            'book_id' => $book->id,
            'copy_code' => $copyCode,
            'barcode' => $barcode ?: $copyCode,
            'shelf_location' => $shelf,
            'condition' => $condition,
            'status' => $status,
        ]);
    }

    protected function nextAccessionNumber(int $institutionId, int $bookId, ?string $prefix = null): string
    {
        $base = $this->normalizePrefix($prefix ?: "ACC-{$bookId}");

        $existing = LibraryBookCopy::where('institution_id', $institutionId)
            ->where('book_id', $bookId)
            ->where('copy_code', 'like', $base.'-%')
            ->pluck('copy_code');

        $max = 0;
        foreach ($existing as $code) {
            if (preg_match('/-(\d+)$/', $code, $m)) {
                $max = max($max, (int) $m[1]);
            }
        }

        return sprintf('%s-%03d', $base, $max + 1);
    }

    protected function normalizePrefix(string $prefix): string
    {
        $prefix = strtoupper(trim($prefix));
        $prefix = preg_replace('/[^A-Z0-9\-]/', '', str_replace(' ', '-', $prefix));

        return $prefix !== '' ? $prefix : 'ACC';
    }
}
