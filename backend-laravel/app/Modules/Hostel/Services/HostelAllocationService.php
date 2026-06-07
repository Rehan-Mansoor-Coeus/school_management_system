<?php

namespace App\Modules\Hostel\Services;

use App\Modules\Hostel\Models\Hostel;
use App\Modules\Hostel\Models\HostelAllocation;
use App\Modules\Hostel\Models\HostelBed;
use App\Modules\Hostel\Models\HostelClearance;
use App\Modules\Hostel\Models\HostelPayment;
use App\Modules\Hostel\Models\HostelRegistration;
use App\Modules\Hostel\Models\HostelRoom;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class HostelAllocationService
{
    public function ensureBedsForRoom(HostelRoom $room): void
    {
        $existing = $room->beds()->count();
        if ($existing >= $room->capacity) {
            return;
        }

        for ($i = $existing + 1; $i <= $room->capacity; $i++) {
            HostelBed::firstOrCreate(
                [
                    'room_id' => $room->id,
                    'bed_label' => (string) $i,
                ],
                [
                    'institution_id' => $room->institution_id,
                    'status' => 'available',
                ]
            );
        }
    }

    public function allocate(array $data): HostelAllocation
    {
        return DB::transaction(function () use ($data) {
            $room = HostelRoom::where('institution_id', $data['institution_id'])
                ->where('id', $data['room_id'])
                ->lockForUpdate()
                ->firstOrFail();

            $this->ensureBedsForRoom($room);

            $bed = null;
            if (! empty($data['bed_id'])) {
                $bed = HostelBed::where('room_id', $room->id)
                    ->where('id', $data['bed_id'])
                    ->where('status', 'available')
                    ->lockForUpdate()
                    ->firstOrFail();
            } else {
                $bed = HostelBed::where('room_id', $room->id)
                    ->where('status', 'available')
                    ->lockForUpdate()
                    ->first();
            }

            if (! $bed) {
                abort(422, __('hostel.no_bed_available'));
            }

            $allocation = HostelAllocation::create([
                'institution_id' => $data['institution_id'],
                'student_id' => $data['student_id'],
                'room_id' => $room->id,
                'bed_id' => $bed->id,
                'academic_year_id' => $data['academic_year_id'],
                'registration_id' => $data['registration_id'] ?? null,
                'allocation_date' => $data['allocation_date'] ?? now()->toDateString(),
                'check_in_date' => $data['check_in_date'] ?? null,
                'status' => $data['status'] ?? 'allocated',
                'remarks' => $data['remarks'] ?? null,
            ]);

            $bed->update(['status' => 'occupied']);
            $this->syncRoomOccupancy($room);
            $this->syncHostelOccupancy($room->hostel_id);

            if (! empty($data['registration_id'])) {
                HostelRegistration::where('id', $data['registration_id'])
                    ->update(['status' => 'allocated']);
            }

            $feeAmount = $data['fee_amount'] ?? $room->monthly_fee;
            if ($feeAmount > 0) {
                HostelPayment::create([
                    'institution_id' => $data['institution_id'],
                    'student_id' => $data['student_id'],
                    'allocation_id' => $allocation->id,
                    'reference' => 'HST-' . strtoupper(Str::random(10)),
                    'amount' => $feeAmount,
                    'amount_paid' => 0,
                    'status' => 'pending',
                ]);
            }

            return $allocation->load(['student.user', 'room.hostel', 'bed', 'academicYear']);
        });
    }

    public function checkIn(HostelAllocation $allocation): HostelAllocation
    {
        $allocation->update([
            'status' => 'active',
            'check_in_date' => $allocation->check_in_date ?: now()->toDateString(),
        ]);

        return $allocation->fresh(['student.user', 'room.hostel', 'bed']);
    }

    public function release(HostelAllocation $allocation, ?string $checkOutDate = null): HostelAllocation
    {
        return DB::transaction(function () use ($allocation, $checkOutDate) {
            $allocation->update([
                'status' => 'completed',
                'check_out_date' => $checkOutDate ?: now()->toDateString(),
            ]);

            if ($allocation->bed_id) {
                HostelBed::where('id', $allocation->bed_id)->update(['status' => 'available']);
            }

            $room = $allocation->room()->first();
            if ($room) {
                $this->syncRoomOccupancy($room);
                $this->syncHostelOccupancy($room->hostel_id);
            }

            HostelClearance::firstOrCreate(
                ['allocation_id' => $allocation->id],
                [
                    'institution_id' => $allocation->institution_id,
                    'status' => 'pending',
                ]
            );

            return $allocation->fresh(['student.user', 'room.hostel', 'bed', 'clearance']);
        });
    }

    public function syncRoomOccupancy(HostelRoom $room): void
    {
        $occupied = HostelAllocation::where('room_id', $room->id)
            ->whereIn('status', ['allocated', 'active'])
            ->count();

        $status = 'available';
        if ($occupied >= $room->capacity) {
            $status = 'full';
        } elseif ($room->status === 'maintenance' || $room->status === 'closed') {
            $status = $room->status;
        }

        $room->update([
            'occupied_beds' => $occupied,
            'status' => $status,
        ]);
    }

    public function syncHostelOccupancy(int $hostelId): void
    {
        $hostel = Hostel::find($hostelId);
        if (! $hostel) {
            return;
        }

        $rooms = HostelRoom::where('hostel_id', $hostelId)->get();
        $totalCapacity = $rooms->sum('capacity');
        $occupied = HostelAllocation::whereIn('room_id', $rooms->pluck('id'))
            ->whereIn('status', ['allocated', 'active'])
            ->count();

        $hostel->update([
            'total_rooms' => $rooms->count(),
            'total_capacity' => $totalCapacity,
            'occupied_capacity' => $occupied,
        ]);
    }
}
