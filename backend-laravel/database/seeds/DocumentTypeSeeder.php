<?php

use App\Institution;
use App\Modules\Contracts\Models\ContractTemplate;
use App\Modules\Contracts\Models\DocumentType;
use Illuminate\Database\Seeder;

class DocumentTypeSeeder extends Seeder
{
    public function run()
    {
        foreach (Institution::all() as $institution) {
            foreach ($this->definitions() as $def) {
                $template = ContractTemplate::firstOrCreate(
                    ['institution_id' => $institution->id, 'code' => $def['key']],
                    [
                        'name' => $def['name'].' Template',
                        'category' => $def['category'],
                        'recipient_type' => $def['recipient_type'],
                        'body_html' => $def['body_html'],
                        'merge_fields' => $def['merge_fields'] ?? [],
                        'required_documents' => $def['required_uploads'] ?? [],
                        'signer_fields' => $def['signer_fields'] ?? [],
                        'is_active' => true,
                    ]
                );

                $type = DocumentType::updateOrCreate(
                    ['institution_id' => $institution->id, 'key' => $def['key']],
                    [
                        'name' => $def['name'],
                        'description' => $def['description'] ?? null,
                        'category' => $def['category'],
                        'recipient_type' => $def['recipient_type'],
                        'default_template_id' => $template->id,
                        'required_signatories' => $def['required_signatories'],
                        'required_approvers' => $def['required_approvers'],
                        'required_uploads' => $def['required_uploads'] ?? [],
                        'field_schema' => $def['field_schema'] ?? [],
                        'expiry_rules' => $def['expiry_rules'] ?? [],
                        'notification_rules' => ['channels' => ['email', 'internal']],
                        'supports_expiry' => $def['supports_expiry'] ?? false,
                        'is_system' => true,
                        'is_active' => true,
                    ]
                );

                if (! $template->document_type_id) {
                    $template->update(['document_type_id' => $type->id]);
                }
            }
        }
    }

    protected function definitions(): array
    {
        return [
            [
                'key' => 'student_enrollment_agreement',
                'name' => 'Student Enrollment Agreement',
                'description' => 'Generated after admission. Signed by student and parent/guardian.',
                'category' => 'student',
                'recipient_type' => 'student',
                'required_signatories' => [
                    ['role' => 'student', 'label' => 'Student', 'required' => true],
                    ['role' => 'parent', 'label' => 'Parent/Guardian', 'required' => true],
                ],
                'required_approvers' => [
                    ['role' => 'admission-officer', 'label' => 'Admission Officer'],
                    ['role' => 'registrar', 'label' => 'Registrar'],
                ],
                'required_uploads' => [
                    ['key' => 'birth_certificate', 'label' => 'Birth Certificate'],
                    ['key' => 'previous_certificate', 'label' => 'Previous Certificate'],
                    ['key' => 'national_id', 'label' => 'National ID'],
                    ['key' => 'passport_photo', 'label' => 'Passport Photo'],
                ],
                'body_html' => $this->section('Enrollment', 'This agreement enrolls <strong>{{full_name}}</strong> (Student No: {{student_number}}) into <strong>{{programme}}</strong>, {{department}}. Tuition: <strong>{{tuition_amount}}</strong>.'),
            ],
            [
                'key' => 'staff_contract',
                'name' => 'Staff Contract',
                'description' => 'Employment contract for teaching and non-teaching staff, with payroll integration.',
                'category' => 'staff',
                'recipient_type' => 'staff',
                'supports_expiry' => true,
                'required_signatories' => [
                    ['role' => 'staff', 'label' => 'Staff Member', 'required' => true],
                ],
                'required_approvers' => [
                    ['role' => 'hr-officer', 'label' => 'HR Officer'],
                    ['role' => 'director', 'label' => 'Director'],
                ],
                'required_uploads' => [
                    ['key' => 'national_id', 'label' => 'National ID'],
                    ['key' => 'certifications', 'label' => 'Professional Certifications'],
                    ['key' => 'cv', 'label' => 'CV'],
                ],
                'body_html' => $this->section('Appointment', '<strong>{{institution_name}}</strong> appoints <strong>{{full_name}}</strong> as <strong>{{job_title}}</strong> in {{department}}. Monthly salary: <strong>{{monthly_rate}}</strong>. Period: {{contract_start_date}} to {{contract_end_date}}.'),
            ],
            [
                'key' => 'leave_approval',
                'name' => 'Leave Approval',
                'description' => 'Staff leave application and multi-level approval.',
                'category' => 'staff',
                'recipient_type' => 'staff',
                'required_signatories' => [
                    ['role' => 'staff', 'label' => 'Staff Member', 'required' => true],
                ],
                'required_approvers' => [
                    ['role' => 'head-of-department', 'label' => 'Head of Department'],
                    ['role' => 'hr-officer', 'label' => 'HR Officer'],
                    ['role' => 'director', 'label' => 'Director'],
                ],
                'field_schema' => [
                    ['key' => 'leave_type', 'label' => 'Leave Type', 'type' => 'text'],
                    ['key' => 'start_date', 'label' => 'Start Date', 'type' => 'date'],
                    ['key' => 'end_date', 'label' => 'End Date', 'type' => 'date'],
                    ['key' => 'number_of_days', 'label' => 'Number of Days', 'type' => 'number'],
                    ['key' => 'reason', 'label' => 'Reason', 'type' => 'textarea'],
                ],
                'body_html' => $this->section('Leave Request', '<strong>{{full_name}}</strong> requests <strong>{{leave_type}}</strong> leave from <strong>{{start_date}}</strong> to <strong>{{end_date}}</strong> ({{number_of_days}} days). Reason: {{reason}}.'),
            ],
            [
                'key' => 'mission_order',
                'name' => 'Mission Order',
                'description' => 'Official duty travel authorization.',
                'category' => 'staff',
                'recipient_type' => 'staff',
                'required_signatories' => [
                    ['role' => 'staff', 'label' => 'Staff Member', 'required' => true],
                ],
                'required_approvers' => [
                    ['role' => 'supervisor', 'label' => 'Supervisor'],
                    ['role' => 'finance-officer', 'label' => 'Finance Officer'],
                    ['role' => 'director', 'label' => 'Director'],
                ],
                'field_schema' => [
                    ['key' => 'destination', 'label' => 'Destination', 'type' => 'text'],
                    ['key' => 'purpose', 'label' => 'Purpose of Mission', 'type' => 'textarea'],
                    ['key' => 'travel_dates', 'label' => 'Travel Dates', 'type' => 'text'],
                    ['key' => 'transport', 'label' => 'Transport Details', 'type' => 'text'],
                    ['key' => 'estimated_cost', 'label' => 'Estimated Cost', 'type' => 'number'],
                    ['key' => 'per_diem', 'label' => 'Per Diem', 'type' => 'number'],
                    ['key' => 'project', 'label' => 'Assigned Project/Department', 'type' => 'text'],
                ],
                'body_html' => $this->section('Mission', '<strong>{{full_name}}</strong> is authorized to travel to <strong>{{destination}}</strong> for: {{purpose}}. Dates: {{travel_dates}}. Transport: {{transport}}. Estimated cost: {{estimated_cost}}; Per diem: {{per_diem}}.'),
            ],
            [
                'key' => 'parent_consent_form',
                'name' => 'Parent Consent Form',
                'description' => 'Parent/guardian consent for student activities.',
                'category' => 'student',
                'recipient_type' => 'student',
                'required_signatories' => [
                    ['role' => 'parent', 'label' => 'Parent/Guardian', 'required' => true],
                ],
                'required_approvers' => [
                    ['role' => 'registrar', 'label' => 'School Administration'],
                ],
                'field_schema' => [
                    ['key' => 'student_name', 'label' => 'Student Name', 'type' => 'text'],
                    ['key' => 'activity_name', 'label' => 'Activity Name', 'type' => 'text'],
                    ['key' => 'activity_date', 'label' => 'Activity Date', 'type' => 'date'],
                    ['key' => 'risk_note', 'label' => 'Risk Note', 'type' => 'textarea'],
                    ['key' => 'emergency_contact', 'label' => 'Emergency Contact', 'type' => 'text'],
                ],
                'body_html' => $this->section('Consent', 'I, parent/guardian of <strong>{{student_name}}</strong>, consent to participation in <strong>{{activity_name}}</strong> on {{activity_date}}. Risk note: {{risk_note}}. Emergency contact: {{emergency_contact}}.'),
            ],
            [
                'key' => 'disciplinary_acknowledgement',
                'name' => 'Disciplinary Acknowledgement',
                'description' => 'Acknowledgement of disciplinary case decision.',
                'category' => 'general',
                'recipient_type' => 'student',
                'required_signatories' => [
                    ['role' => 'subject', 'label' => 'Student/Staff', 'required' => true],
                    ['role' => 'parent', 'label' => 'Parent/Guardian', 'required' => false],
                ],
                'required_approvers' => [
                    ['role' => 'disciplinary-committee', 'label' => 'Disciplinary Committee'],
                    ['role' => 'principal', 'label' => 'Principal/Director'],
                ],
                'field_schema' => [
                    ['key' => 'case_summary', 'label' => 'Case Summary', 'type' => 'textarea'],
                    ['key' => 'decision', 'label' => 'Decision', 'type' => 'textarea'],
                    ['key' => 'required_action', 'label' => 'Required Action', 'type' => 'textarea'],
                    ['key' => 'warning_level', 'label' => 'Warning Level', 'type' => 'text'],
                ],
                'body_html' => $this->section('Disciplinary Decision', 'Case summary: {{case_summary}}. Decision: {{decision}}. Required action: {{required_action}}. Warning level: <strong>{{warning_level}}</strong>.'),
            ],
            [
                'key' => 'board_resolution',
                'name' => 'Board Resolution',
                'description' => 'Board/management decision with member signatures.',
                'category' => 'general',
                'recipient_type' => 'other',
                'required_signatories' => [
                    ['role' => 'board-member', 'label' => 'Board Member', 'required' => true],
                    ['role' => 'chairperson', 'label' => 'Chairperson', 'required' => true],
                ],
                'required_approvers' => [
                    ['role' => 'secretary', 'label' => 'Secretary (Certification)'],
                ],
                'field_schema' => [
                    ['key' => 'meeting_date', 'label' => 'Meeting Date', 'type' => 'date'],
                    ['key' => 'resolution_number', 'label' => 'Resolution Number', 'type' => 'text'],
                    ['key' => 'decision_summary', 'label' => 'Decision Summary', 'type' => 'textarea'],
                    ['key' => 'voting_outcome', 'label' => 'Voting Outcome', 'type' => 'text'],
                    ['key' => 'board_members', 'label' => 'Board Members', 'type' => 'textarea'],
                ],
                'body_html' => $this->section('Resolution', 'Resolution <strong>{{resolution_number}}</strong> passed on {{meeting_date}}. Decision: {{decision_summary}}. Voting outcome: {{voting_outcome}}. Members: {{board_members}}.'),
            ],
            [
                'key' => 'internship_agreement',
                'name' => 'Internship Agreement',
                'description' => 'Agreement for students or external interns.',
                'category' => 'student',
                'recipient_type' => 'student',
                'supports_expiry' => true,
                'required_signatories' => [
                    ['role' => 'intern', 'label' => 'Intern', 'required' => true],
                ],
                'required_approvers' => [
                    ['role' => 'institution', 'label' => 'Institution'],
                    ['role' => 'host-organization', 'label' => 'Host Organization'],
                ],
                'field_schema' => [
                    ['key' => 'start_date', 'label' => 'Start Date', 'type' => 'date'],
                    ['key' => 'end_date', 'label' => 'End Date', 'type' => 'date'],
                    ['key' => 'department', 'label' => 'Department', 'type' => 'text'],
                    ['key' => 'supervisor', 'label' => 'Supervisor', 'type' => 'text'],
                    ['key' => 'duties', 'label' => 'Duties', 'type' => 'textarea'],
                ],
                'body_html' => $this->section('Internship', '<strong>{{full_name}}</strong> will intern in {{department}} from {{start_date}} to {{end_date}} under {{supervisor}}. Duties: {{duties}}.'),
            ],
            [
                'key' => 'research_ethics_approval',
                'name' => 'Research Ethics Approval',
                'description' => 'Ethics approval for research projects.',
                'category' => 'general',
                'recipient_type' => 'student',
                'supports_expiry' => true,
                'required_signatories' => [
                    ['role' => 'researcher', 'label' => 'Researcher', 'required' => true],
                ],
                'required_approvers' => [
                    ['role' => 'supervisor', 'label' => 'Supervisor'],
                    ['role' => 'ethics-committee', 'label' => 'Ethics Committee'],
                    ['role' => 'institution', 'label' => 'Institution'],
                ],
                'field_schema' => [
                    ['key' => 'research_title', 'label' => 'Research Title', 'type' => 'text'],
                    ['key' => 'principal_investigator', 'label' => 'Principal Investigator', 'type' => 'text'],
                    ['key' => 'department', 'label' => 'Department', 'type' => 'text'],
                    ['key' => 'data_collection_period', 'label' => 'Data Collection Period', 'type' => 'text'],
                    ['key' => 'ethical_conditions', 'label' => 'Ethical Conditions', 'type' => 'textarea'],
                ],
                'body_html' => $this->section('Research Ethics', 'Research: <strong>{{research_title}}</strong>. PI: {{principal_investigator}} ({{department}}). Data collection: {{data_collection_period}}. Conditions: {{ethical_conditions}}.'),
            ],
        ];
    }

    protected function section(string $title, string $content): string
    {
        return '<div class="contract-section"><h3>'.$title.'</h3><p>'.$content.'</p></div>'
            .'<div class="contract-section"><h3>Declaration</h3><p>By signing below, the parties confirm the accuracy of the information and agree to the terms set out in this document issued by <strong>{{institution_name}}</strong> on {{contract_date}}.</p></div>';
    }
}
