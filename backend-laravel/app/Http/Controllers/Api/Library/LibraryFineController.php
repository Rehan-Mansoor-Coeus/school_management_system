<?php

namespace App\Http\Controllers\Api\Library;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Library\Concerns\ResolvesLibraryContext;
use App\Library\LibraryFine;
use Illuminate\Http\Request;

class LibraryFineController extends Controller
{
    use ResolvesLibraryContext;

    public function index(Request $request)
    {
        $this->authorizeLibrary($request, ['manage_library_fines', 'view_library_reports', 'view_overdue_books']);

        $query = LibraryFine::with(['user:id,name,phone_number', 'book:id,title'])
            ->where('institution_id', $this->institutionId($request));

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }
        if ($userId = $request->get('user_id')) {
            $query->where('user_id', $userId);
        }

        $fines = $query->orderByDesc('created_at')->get()->map(function (LibraryFine $fine) {
            return [
                'id' => $fine->id,
                'user_id' => $fine->user_id,
                'user_name' => optional($fine->user)->name,
                'user_phone' => optional($fine->user)->phone_number,
                'book_id' => $fine->book_id,
                'book_title' => optional($fine->book)->title,
                'borrow_request_id' => $fine->borrow_request_id,
                'overdue_days' => $fine->overdue_days,
                'fine_amount' => $fine->fine_amount,
                'status' => $fine->status,
                'payment_date' => $fine->payment_date,
                'comment' => $fine->comment,
                'created_at' => $fine->created_at,
            ];
        });

        return response()->json($fines);
    }

    public function markPaid(Request $request, $id)
    {
        $this->authorizeLibrary($request, ['manage_library_fines']);

        $fine = LibraryFine::where('institution_id', $this->institutionId($request))->findOrFail($id);
        $data = $request->validate(['comment' => 'nullable|string|max:1000']);

        $fine->update([
            'status' => LibraryFine::STATUS_PAID,
            'payment_date' => now(),
            'paid_by' => optional($request->user())->id,
            'comment' => $data['comment'] ?? $fine->comment,
        ]);

        return response()->json($fine);
    }

    public function waive(Request $request, $id)
    {
        $this->authorizeLibrary($request, ['manage_library_fines']);

        $fine = LibraryFine::where('institution_id', $this->institutionId($request))->findOrFail($id);
        $data = $request->validate(['comment' => 'nullable|string|max:1000']);

        $fine->update([
            'status' => LibraryFine::STATUS_WAIVED,
            'waived_by' => optional($request->user())->id,
            'comment' => $data['comment'] ?? $fine->comment,
        ]);

        return response()->json($fine);
    }
}
