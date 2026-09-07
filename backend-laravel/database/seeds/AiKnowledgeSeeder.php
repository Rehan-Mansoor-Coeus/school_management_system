<?php

use App\Modules\AiAssistant\Models\AiKnowledgeArticle;
use App\Modules\AiAssistant\Services\AiKnowledgeService;
use Illuminate\Database\Seeder;

class AiKnowledgeSeeder extends Seeder
{
    public function run()
    {
        $knowledge = app(AiKnowledgeService::class);
        foreach ($this->articles() as $article) {
            AiKnowledgeArticle::withoutEvents(function () use ($knowledge, $article) {
                $knowledge->upsertArticle($article);
            });
        }
    }

    protected function articles()
    {
        return [
            [
                'slug' => 'what-is-okusoma',
                'title' => 'What is Okusoma?',
                'category' => 'getting_started',
                'audience' => 'public',
                'keywords' => 'okusoma, assms, school management, what is',
                'source_type' => 'help',
                'source_reference' => 'What is Okusoma',
                'content' => 'Okusoma is the African Students School Management System (ASSMS). It helps schools, colleges and universities manage admissions, academics, fees, timetable, library, hostel, HR, letters and announcements in one multi-tenant platform. Students register at /register. Staff sign in at /admin. Institutions request access at /request-institution.',
            ],
            [
                'slug' => 'student-registration',
                'title' => 'Student registration',
                'category' => 'students',
                'audience' => 'public',
                'keywords' => 'signup, register, student, otp, whatsapp',
                'source_type' => 'help',
                'source_reference' => 'Student Registration',
                'content' => 'To sign up as a student: go to /register or Sign in → Create an account. Select your institution, enter your WhatsApp number, verify the OTP sent to WhatsApp, then complete your profile. After signup you can sign in and apply for admission. Staff accounts are created by administrators; staff do not use student signup.',
            ],
            [
                'slug' => 'institution-onboarding',
                'title' => 'How an institution subscribes',
                'category' => 'institution_management',
                'audience' => 'public',
                'keywords' => 'institution, subscribe, onboard, request access, school',
                'source_type' => 'help',
                'source_reference' => 'Institution onboarding',
                'content' => 'An institution requests access from /request-institution. Alpha Bridge reviews the request. After approval, an institution-admin account is created and a license plan can be assigned. The school admin then signs in at /admin, completes the school profile, turns on modules, and follows the Help setup order: units → departments → programmes → subjects → organization → users → admissions.',
            ],
            [
                'slug' => 'licensing-overview',
                'title' => 'How licensing works',
                'category' => 'licensing',
                'audience' => 'public',
                'keywords' => 'license, licensing, activate, renewal, trial',
                'source_type' => 'help',
                'source_reference' => 'Licensing',
                'content' => 'Okusoma licenses are configured by the Super Admin in Licenses & Billing. A school receives a license plan (free, fixed, modular, or per-student). Activation, trial days, grace period and renewal come from that plan. School admins see status under Subscription & Billing. The chatbot always reads live prices from license_plans and general_settings — it never invents a fee.',
            ],
            [
                'slug' => 'pricing-and-subscriptions',
                'title' => 'Pricing and subscription plans',
                'category' => 'pricing',
                'audience' => 'public',
                'keywords' => 'price, cost, subscription, fee, plan',
                'source_type' => 'help',
                'source_reference' => 'Pricing',
                'content' => 'The landing page shows the current per-student license fee from Super Admin general settings. Individual license plans (name, currency, base price, setup fee, trial days, price per student) are stored in the license_plans table. Ask the assistant “How much does Okusoma cost?” and it will query the live configuration. For a quote at a specific student count, request access or contact Alpha Bridge.',
            ],
            [
                'slug' => 'payment-methods',
                'title' => 'Payment methods',
                'category' => 'finance',
                'audience' => 'public',
                'keywords' => 'payment, momo, mobile money, pawapay, bank, proof',
                'source_type' => 'help',
                'source_reference' => 'Payment methods',
                'content' => 'Students can pay application and tuition fees using the methods enabled for their institution, including Mobile Money (PawaPay) and payment-proof upload. Finance officers verify proofs in Admissions → Finance. School license invoices are paid through the institution billing portal or recorded by Super Admin. The school fee of record stays in the school currency.',
            ],
            [
                'slug' => 'password-reset',
                'title' => 'Password reset',
                'category' => 'passwords',
                'audience' => 'public',
                'keywords' => 'password, reset, forgot, otp, login',
                'source_type' => 'help',
                'source_reference' => 'Password reset',
                'content' => 'On the Okusoma login page (/admin), select Forgot Password. Enter the email, username, or WhatsApp number connected to your account. Enter the OTP sent to WhatsApp, then set a new password. Okusoma never asks for your current password in chat and never shows another user’s password or password hash.',
            ],
            [
                'slug' => 'login-problems',
                'title' => 'Login problems',
                'category' => 'troubleshooting',
                'audience' => 'public',
                'keywords' => 'login, sign in, locked, inactive, 401',
                'source_type' => 'help',
                'source_reference' => 'Login problems',
                'content' => 'Staff sign in at /admin with email, username, or phone plus password. Students can also use /register then sign in. If login fails: check the identifier, use Forgot Password, and confirm the account is active. Inactive or deleted accounts cannot sign in. After idle time the session expires and you must sign in again.',
            ],
            [
                'slug' => 'admissions-flow',
                'title' => 'Admissions',
                'category' => 'admissions',
                'audience' => 'public',
                'keywords' => 'admissions, apply, registry, hod, registrar, enroll',
                'source_type' => 'help',
                'source_reference' => 'Admissions',
                'content' => 'Admissions flow: student applies and uploads documents → pays application fee → Registry reviews documents → HOD/department reviews → Registrar admits and sends the admission letter → student accepts → Finance verifies tuition → enrollment creates the student record and registration number. Course registration happens after enrollment and is approved by the HOD.',
            ],
            [
                'slug' => 'adding-students-teachers',
                'title' => 'Adding students and teachers',
                'category' => 'students',
                'audience' => 'public',
                'keywords' => 'users, teachers, students, add user',
                'source_type' => 'help',
                'source_reference' => 'Adding people',
                'content' => 'School admins add teachers and staff from Users. Teachers need the Teacher role so they appear in timetable assignments. Students usually self-register and are created as student records during enrollment. Roles & Permissions controls what each person can see.',
            ],
            [
                'slug' => 'fees-module',
                'title' => 'Fees',
                'category' => 'finance',
                'audience' => 'public',
                'keywords' => 'fees, tuition, invoice, balance',
                'source_type' => 'help',
                'source_reference' => 'Fees',
                'content' => 'Fees are configured per programme and semester. Students see their own invoices. Finance officers record or verify payments. The balance decreases as payments complete. Overpayment is blocked. Currency follows the school record.',
            ],
            [
                'slug' => 'timetable-module',
                'title' => 'Timetables',
                'category' => 'timetable',
                'audience' => 'public',
                'keywords' => 'timetable, classrooms, courses, generate, publish',
                'source_type' => 'help',
                'source_reference' => 'Timetable',
                'content' => 'Timetable order: Classrooms → Courses → Assignments → Teacher availability → Generate → Publish. Students only see published or approved entries for their programme. Teachers see classes assigned to them. Conflicts should be reported, not silently saved.',
            ],
            [
                'slug' => 'library-hostel-hr',
                'title' => 'Library, Hostel, HR and Payroll',
                'category' => 'library',
                'audience' => 'public',
                'keywords' => 'library, hostel, hr, payroll, contracts',
                'source_type' => 'help',
                'source_reference' => 'Optional modules',
                'content' => 'Library manages books, borrow/return, due dates and fines. Hostel manages rooms and allocations. HR and Payroll manage staff, jobs, payslips and letters. Contracts and document workflow handle staff/student documents. Enable each module under Modules only when the school is ready.',
            ],
            [
                'slug' => 'letters-announcements',
                'title' => 'Letters and announcements',
                'category' => 'faq',
                'audience' => 'public',
                'keywords' => 'letters, announcements, whatsapp',
                'source_type' => 'help',
                'source_reference' => 'Letters',
                'content' => 'Letters use the school letterhead and can include admission or rejection letters. Announcements can be scheduled and sent, including WhatsApp when messaging is configured. Configure branding under Letters before sending production messages.',
            ],
            [
                'slug' => 'modules-and-lecture-halls',
                'title' => 'Modules, lecture halls and courses',
                'category' => 'institution_management',
                'audience' => 'public',
                'keywords' => 'modules, classrooms, lecture halls, courses',
                'source_type' => 'help',
                'source_reference' => 'Modules',
                'content' => 'Modules toggles control whether Admissions, Fees, Timetable, Library and other menus appear. Lecture halls and labs are created under Timetable → Classrooms. Courses are created and assigned to teachers and programme semesters before generating a timetable.',
            ],
            [
                'slug' => 'results-and-security',
                'title' => 'Results and account security',
                'category' => 'results',
                'audience' => 'public',
                'keywords' => 'results, grades, security, permissions',
                'source_type' => 'help',
                'source_reference' => 'Results',
                'content' => 'Published results appear on the student report. Teachers and registrars only see records they are permitted to view. Okusoma is multi-tenant: a user from one school never sees another school’s data. Chat cannot override these rules.',
            ],
            [
                'slug' => 'faq-demo-and-help',
                'title' => 'FAQ: demo, help and support',
                'category' => 'faq',
                'audience' => 'public',
                'keywords' => 'faq, demo, help, support, contact',
                'source_type' => 'help',
                'source_reference' => 'FAQ',
                'content' => 'Request a demo from the homepage or Contact page. After sign-in, School Admin Help is in the sidebar at /help. For questions the assistant cannot verify, use Contact or the in-chat support form so Alpha Bridge can follow up.',
            ],
        ];
    }
}
