<?php

namespace App\Modules\Admissions\Services;

use App\Modules\Admissions\Models\Application;

class ApplicationProgressService
{
    protected $steps = [
        ['key' => 'submitted', 'label_key' => 'progress_submitted', 'weight' => 10],
        ['key' => 'fee_paid', 'label_key' => 'progress_fee_paid', 'weight' => 10],
        ['key' => 'registry_reviewed', 'label_key' => 'progress_registry', 'weight' => 10],
        ['key' => 'department_approved', 'label_key' => 'progress_department', 'weight' => 10],
        ['key' => 'admitted', 'label_key' => 'progress_admitted', 'weight' => 15],
        ['key' => 'accepted', 'label_key' => 'progress_accepted', 'weight' => 15],
        ['key' => 'tuition_paid', 'label_key' => 'progress_tuition_paid', 'weight' => 15],
        ['key' => 'enrolled', 'label_key' => 'progress_enrolled', 'weight' => 15],
    ];

    public function forApplication(Application $application): array
    {
        $currentIndex = $this->resolveStepIndex($application);
        $totalWeight = array_sum(array_column($this->steps, 'weight'));
        $completedWeight = 0;

        $steps = [];
        foreach ($this->steps as $index => $step) {
            $state = 'pending';
            if ($index < $currentIndex) {
                $state = 'completed';
                $completedWeight += $step['weight'];
            } elseif ($index === $currentIndex && $application->status !== 'rejected') {
                $state = 'current';
                $completedWeight += (int) ($step['weight'] * 0.5);
            }

            if ($application->status === 'rejected' && $index === $currentIndex) {
                $state = 'rejected';
            }

            $steps[] = array_merge($step, ['state' => $state]);
        }

        if ($application->status === 'rejected') {
            $completedWeight = 0;
        }

        $percent = $application->status === 'enrolled'
            ? 100
            : min(100, (int) round(($completedWeight / $totalWeight) * 100));

        return [
            'percent' => $percent,
            'current_step' => $this->steps[$currentIndex]['key'] ?? 'submitted',
            'steps' => $steps,
            'status' => $application->status,
        ];
    }

    protected function resolveStepIndex(Application $application): int
    {
        if ($application->status === 'rejected') {
            return $this->indexForStatus($application->status);
        }

        if ($application->status === 'enrolled') {
            return count($this->steps) - 1;
        }

        if ($application->status === 'tuition_paid' || $application->tuition_verified_at) {
            return 6;
        }

        if ($application->status === 'accepted' || $application->admission_accepted) {
            return 5;
        }

        if ($application->status === 'admitted') {
            return 4;
        }

        if (in_array($application->status, ['department_approved'], true)) {
            return 3;
        }

        if ($application->status === 'registry_reviewed') {
            return 2;
        }

        if ($application->application_fee_paid) {
            return 1;
        }

        return 0;
    }

    protected function indexForStatus(string $status): int
    {
        $map = [
            'submitted' => 0,
            'registry_reviewed' => 2,
            'department_approved' => 3,
            'admitted' => 4,
            'accepted' => 5,
            'tuition_paid' => 6,
            'enrolled' => 7,
            'rejected' => 0,
        ];

        return $map[$status] ?? 0;
    }
}
