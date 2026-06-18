<?php

return [
    'module' => 'Feuilles de temps',
    'my_schedule' => 'Mon horaire',
    'contact_hours' => 'Heures de contact',
    'submit_timesheet' => 'Soumettre la feuille de temps',
    'topic_taught' => 'Sujet enseigné',
    'course_master' => 'Responsable de cours',
    'required_contact_hours' => 'Heures de contact requises',
    'completed_contact_hours' => 'Heures de contact effectuées',
    'remaining_contact_hours' => 'Heures de contact restantes',
    'approve' => 'Approuver',
    'reject' => 'Rejeter',
    'request_correction' => 'Demander une correction',
    'shift_types' => 'Types de poste',
    'teacher_availability' => 'Disponibilité des enseignants',
    'course_planning' => 'Planification des heures de contact',
    'timetable_suggestion' => 'Suggestion d\'emploi du temps',
    'teacher_schedules' => 'Horaires des enseignants',
    'staff_schedules' => 'Horaires du personnel',
    'reports' => 'Rapports',
    'dashboard' => 'Tableau de bord des feuilles de temps',
    'saved' => 'Enregistré avec succès.',
    'submitted' => 'Soumis avec succès.',
    'approved' => 'Approuvé avec succès.',
    'rejected' => 'Rejeté avec succès.',
    'correction_requested' => 'Correction demandée.',
    'not_authorized' => 'Vous n\'êtes pas autorisé à effectuer cette action.',
    'institution_mismatch' => 'Enregistrement introuvable dans votre établissement.',
    'teacher_conflict' => 'Conflit d\'horaire enseignant détecté.',
    'class_conflict' => 'Conflit d\'horaire de classe détecté.',
    'outside_availability' => 'L\'horaire est en dehors de la disponibilité de l\'enseignant.',
    'duplicate_entry' => 'Une feuille de temps existe déjà pour cet horaire et cette date.',
    'empty_timesheet' => 'Impossible de soumettre une feuille de temps vide.',
    'validation_failed' => 'Échec de la validation.',
    'notifications' => [
        'class_starting' => [
            'title' => 'Cours bientôt',
            'message' => 'Cher/Chère :name, votre cours de :course commence à :time.',
        ],
        'class_ending' => [
            'title' => 'Fin de cours bientôt',
            'message' => 'Cher/Chère :name, votre cours de :course se termine à :time.',
        ],
        'timesheet_missing' => [
            'title' => 'Feuille de temps manquante',
            'message' => 'Cher/Chère :name, veuillez soumettre votre feuille de temps pour :course.',
        ],
        'timesheet_approved' => [
            'title' => 'Feuille de temps approuvée',
            'message' => 'Cher/Chère :name, votre feuille de temps a été approuvée.',
        ],
        'timesheet_rejected' => [
            'title' => 'Feuille de temps rejetée',
            'message' => 'Cher/Chère :name, votre feuille de temps a été rejetée. Motif : :reason',
        ],
        'correction_requested' => [
            'title' => 'Correction demandée',
            'message' => 'Cher/Chère :name, une correction est requise sur votre feuille de temps. Motif : :reason',
        ],
        'course_hours_behind' => [
            'title' => 'Heures de contact en retard',
            'message' => 'Le cours :course est en retard. Heures de contact restantes : :remaining.',
        ],
        'course_hours_completed' => [
            'title' => 'Heures de contact terminées',
            'message' => 'Le cours :course a atteint les heures de contact requises.',
        ],
        'timetable_conflict' => [
            'title' => 'Conflit d\'emploi du temps',
            'message' => 'Un conflit d\'emploi du temps a été détecté pour :course.',
        ],
        'shift_starting' => [
            'title' => 'Début de poste',
            'message' => 'Cher/Chère :name, votre poste commence à :time.',
        ],
        'shift_ending' => [
            'title' => 'Fin de poste',
            'message' => 'Cher/Chère :name, votre poste se termine à :time.',
        ],
    ],
];
