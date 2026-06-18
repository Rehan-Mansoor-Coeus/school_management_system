<?php

namespace App\Modules\Timetable\Services;

use App\Modules\Timetable\Models\Classroom;

class ClassroomService
{
    public function list(int $institutionId, array $filters = [])
    {
        $query = Classroom::query()->where('institution_id', $institutionId);

        if (! empty($filters['room_type'])) {
            $query->where('room_type', $filters['room_type']);
        }
        if (isset($filters['active']) && $filters['active'] !== '') {
            $query->where('is_active', (bool) $filters['active']);
        }

        return $query->orderBy('name')->get();
    }

    public function create(int $institutionId, ?int $userId, array $data): Classroom
    {
        $data['institution_id'] = $institutionId;
        $data['created_by'] = $userId;

        return Classroom::create($data);
    }

    public function update(Classroom $classroom, array $data): Classroom
    {
        $classroom->update($data);

        return $classroom->fresh();
    }

    public function delete(Classroom $classroom): void
    {
        $classroom->delete();
    }
}
