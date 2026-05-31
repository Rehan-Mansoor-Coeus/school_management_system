<?php

namespace App\Http\Controllers\Api\Letters;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Letters\Concerns\ResolvesLettersContext;
use App\MessageLog;
use Illuminate\Http\Request;

class MessageLogController extends Controller
{
    use ResolvesLettersContext;

    public function index(Request $request)
    {
        if (! $this->hasAnyPermission($request, ['view_announcements', 'view_letters_menu', 'send_letters'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $query = MessageLog::query()
            ->where('institution_id', $this->institutionId($request))
            ->orderByDesc('created_at');

        if ($request->filled('module')) {
            $query->where('module', $request->module);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('recipient_name', 'like', "%{$search}%")
                    ->orWhere('phone_number', 'like', "%{$search}%")
                    ->orWhere('message', 'like', "%{$search}%");
            });
        }

        return response()->json($query->paginate((int) $request->get('per_page', 20)));
    }
}
