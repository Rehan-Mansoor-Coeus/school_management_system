<?php

namespace App\Modules\Admissions\Controllers;

use App\AppNotification;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api');
    }

    public function index(Request $request)
    {
        $notifications = AppNotification::where('user_id', auth()->id())
            ->when($request->category, function ($q) use ($request) {
                $q->where('category', $request->category);
            })
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $notifications->items(),
            'unread_count' => AppNotification::where('user_id', auth()->id())
                ->where('is_read', false)
                ->count(),
            'pagination' => [
                'total' => $notifications->total(),
                'current_page' => $notifications->currentPage(),
            ],
        ]);
    }

    public function markRead($notificationId)
    {
        $notification = AppNotification::where('user_id', auth()->id())
            ->findOrFail($notificationId);

        $notification->update(['is_read' => true, 'read_at' => now()]);

        return response()->json(['success' => true]);
    }
}
