<?php

use App\Modules\Contracts\Models\ContractTemplate;
use Illuminate\Database\Seeder;

class ContractTemplateSeeder extends Seeder
{
    public function run()
    {
        $templates = [
            [
                'name' => 'Student Enrollment Agreement',
                'code' => 'student_enrollment',
                'category' => 'student',
                'recipient_type' => 'student',
                'body_html' => $this->studentEnrollmentHtml(),
                'required_documents' => [
                    ['key' => 'national_id', 'label' => 'National ID'],
                    ['key' => 'passport', 'label' => 'Passport'],
                    ['key' => 'birth_certificate', 'label' => 'Birth Certificate'],
                ],
            ],
            [
                'name' => 'Full-Time Lecturer Contract',
                'code' => 'full_time_lecturer',
                'category' => 'teacher',
                'recipient_type' => 'teacher',
                'body_html' => $this->lecturerContractHtml(),
                'required_documents' => [
                    ['key' => 'national_id', 'label' => 'National ID'],
                    ['key' => 'degree_certificates', 'label' => 'Degree Certificates'],
                    ['key' => 'cv', 'label' => 'CV'],
                ],
            ],
            [
                'name' => 'Permanent Employment Contract',
                'code' => 'permanent_employment',
                'category' => 'staff',
                'recipient_type' => 'staff',
                'body_html' => $this->staffContractHtml(),
                'required_documents' => [
                    ['key' => 'national_id', 'label' => 'National ID'],
                    ['key' => 'professional_certifications', 'label' => 'Professional Certifications'],
                ],
            ],
        ];

        foreach (\App\Institution::all() as $institution) {
            foreach ($templates as $tpl) {
                ContractTemplate::firstOrCreate(
                    ['institution_id' => $institution->id, 'code' => $tpl['code']],
                    $tpl + [
                        'institution_id' => $institution->id,
                        'merge_fields' => [
                            'full_name', 'student_number', 'employee_number', 'programme', 'department',
                            'contract_start_date', 'contract_end_date', 'fixed_salary', 'monthly_rate', 'tuition_amount', 'institution_name',
                        ],
                        'signer_fields' => [
                            ['key' => 'national_id', 'label' => 'National ID Number', 'required' => true],
                            ['key' => 'address', 'label' => 'Address', 'required' => true],
                            ['key' => 'emergency_contact', 'label' => 'Emergency Contact', 'required' => false],
                        ],
                        'is_active' => true,
                    ]
                );
            }
        }
    }

    protected function studentEnrollmentHtml(): string
    {
        return <<<'HTML'
<div class="contract-section"><h3>1. About the Institution</h3><p>This agreement is entered into between <strong>{{institution_name}}</strong> and <strong>{{full_name}}</strong> (Student No: {{student_number}}).</p></div>
<div class="contract-section"><h3>2. Programme</h3><p>The student is enrolled in <strong>{{programme}}</strong> in the <strong>{{department}}</strong> department.</p></div>
<div class="contract-section"><h3>3. Tuition</h3><p>Total tuition amount: <strong>{{tuition_amount}}</strong>.</p></div>
<div class="contract-section"><h3>4. Terms</h3><p>The student agrees to abide by all institutional policies, academic regulations, and code of conduct for the duration of enrollment.</p></div>
HTML;
    }

    protected function lecturerContractHtml(): string
    {
        return <<<'HTML'
<div class="contract-section"><h3>1. Employment</h3><p><strong>{{institution_name}}</strong> hereby employs <strong>{{full_name}}</strong> as a Full-Time Lecturer in <strong>{{department}}</strong>.</p></div>
<div class="contract-section"><h3>2. Compensation</h3><p>Monthly salary: <strong>{{monthly_rate}}</strong>. Employee No: {{employee_number}}.</p></div>
<div class="contract-section"><h3>3. Duration</h3><p>Contract period: <strong>{{contract_start_date}}</strong> to <strong>{{contract_end_date}}</strong>.</p></div>
<div class="contract-section"><h3>4. Duties</h3><p>The lecturer shall perform teaching, research, and administrative duties as assigned by the institution.</p></div>
HTML;
    }

    protected function staffContractHtml(): string
    {
        return <<<'HTML'
<div class="contract-section"><h3>1. Appointment</h3><p><strong>{{institution_name}}</strong> appoints <strong>{{full_name}}</strong> to the position of <strong>{{job_title}}</strong>.</p></div>
<div class="contract-section"><h3>2. Remuneration</h3><p>Monthly salary: <strong>{{fixed_salary}}</strong>. Employee No: {{employee_number}}.</p></div>
<div class="contract-section"><h3>3. Contract Period</h3><p>From <strong>{{contract_start_date}}</strong> to <strong>{{contract_end_date}}</strong>.</p></div>
HTML;
    }
}
