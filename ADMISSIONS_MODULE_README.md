# Admissions Module Documentation

## Overview
The Admissions Module is a comprehensive system for managing student applications, admissions processes, and communications throughout the African Academic ERP.

## Module Structure

### Backend (Laravel)
```
app/Modules/Admissions/
├── Models/
│   ├── Application.php
│   ├── Applicant.php
│   └── ApplicationPayment.php
├── Controllers/
│   ├── ApplicationController.php
│   ├── AdmissionBoardController.php
│   ├── RegistrarController.php
│   ├── PaymentController.php
│   └── CourseRegistrationController.php
├── Requests/
│   ├── StoreApplicantRequest.php
│   ├── StoreApplicationRequest.php
│   ├── ReviewApplicationRequest.php
│   └── ApproveApplicationRequest.php
├── Resources/
│   ├── ApplicationResource.php
│   └── ApplicantResource.php
├── Services/
│   ├── AdmissionLetterService.php
│   ├── PaymentService.php (Flutterwave)
│   └── NotificationService.php (Email, WhatsApp)
├── Mails/
│   └── (Email classes)
└── Routes/
    └── api.php
```

### Frontend (React)
```
src/modules/admissions/
├── pages/
│   ├── ApplicationPage.tsx
│   ├── BoardPage.tsx
│   ├── RegistrarPage.tsx
│   └── CheckoutPage.tsx
├── components/
│   ├── ApplicationForm.tsx (Multi-step form)
│   ├── AdmissionBoardDashboard.tsx
│   ├── RegistrarDashboard.tsx
│   ├── PaymentPage.tsx
│   ├── NotificationBell.tsx
│   └── index.ts
├── services/
│   └── AdmissionsService.ts
├── hooks/
│   ├── useApplicationForm.ts
│   └── useNotifications.ts
├── types/
│   └── index.ts
└── index.ts
```

## Key Features

### 1. Student Application Workflow
- **Step 1**: Create applicant account and profile
- **Step 2**: Select programme and academic year
- **Step 3**: Upload documents (passport, transcript)
- **Step 4**: Application confirmation

### 2. Payment Integration
- Flutterwave payment gateway integration
- Application fee collection
- Payment verification and webhooks
- Payment status tracking

### 3. Admission Board Review
- Dashboard for reviewing pending applications
- Application statistics
- Approve/Reject functionality with reasons
- Application status tracking

### 4. Registrar Admission Management
- View applications ready for admission
- Generate and send admission letters (PDF)
- Auto-generate registration numbers
- Create student accounts
- Assign student roles

### 5. Notifications System
- In-app notifications
- Email notifications
- WhatsApp notifications (via Twilio)
- Notification bell with unread count
- Real-time notification polling

### 6. Course Registration
- Students register courses
- HOD approval workflow
- Course rejection with reasons
- Course registration status tracking

## API Endpoints

### Applicant Endpoints
```
POST   /api/v1/admissions/applicant              Create applicant profile
POST   /api/v1/admissions/apply                  Submit application
GET    /api/v1/admissions/my-applications        Get applicant's applications
GET    /api/v1/admissions/applications/:id       Get single application
```

### Payment Endpoints
```
POST   /api/v1/admissions/payment/initiate       Initialize payment
GET    /api/v1/admissions/payment/verify         Verify payment
POST   /api/v1/admissions/payment/webhook        Flutterwave webhook
```

### Admission Board Endpoints
```
GET    /api/v1/admissions/board/pending          Get pending applications
POST   /api/v1/admissions/board/review/:id       Review application
POST   /api/v1/admissions/board/decide/:id       Approve/Reject application
GET    /api/v1/admissions/board/dashboard        Get board statistics
```

### Registrar Endpoints
```
GET    /api/v1/admissions/registrar/ready        Get ready for admission
POST   /api/v1/admissions/registrar/admit/:id    Admit student
GET    /api/v1/admissions/registrar/dashboard    Get registrar statistics
```

### Course Registration Endpoints
```
POST   /api/v1/admissions/courses/register       Register courses
POST   /api/v1/admissions/courses/:id/approve    HOD approves registration
POST   /api/v1/admissions/courses/:id/reject     HOD rejects registration
```

## Database Tables (Migrations Created)

### Core Tables
- `institutions` - Institution/organization data
- `users` - User accounts
- `roles` - Role definitions
- `role_user` - User-role assignments

### Admissions Tables
- `applicants` - Applicant profiles
- `applications` - Application records
- `payments` - Payment transactions

### Academic Tables
- `departments` - Academic departments
- `programmes` - Study programmes
- `academic_years` - Academic year records
- `semesters` - Semester records
- `courses` - Course definitions
- `course_registrations` - Student course registrations

### Student Tables
- `students` - Student records
- `fees` - Fee structures
- `results` - Academic results
- `report_cards` - Semester report cards
- `transcripts` - Academic transcripts
- `attendance` - Attendance records

### Staff & HR Tables
- `staff` - Staff records
- `contracts` - Employment contracts
- `leaves` - Leave requests
- `timesheets` - Time tracking
- `payroll` - Payroll records

### Facilities Tables
- `hostels` - Hostel information
- `rooms` - Room records
- `hostel_allocations` - Student room allocations
- `meal_plans` - Meal plan definitions
- `canteen_wallets` - Student wallet balances

### Assets & Library Tables
- `asset_categories` - Asset categories
- `assets` - Asset records
- `library_books` - Book inventory
- `book_issues` - Book borrowing records

### Other Tables
- `timetables` - Class timetables
- `result_appeals` - Result appeal requests
- `mission_orders` - Mission/travel orders
- `notifications` - System notifications
- `audit_logs` - Activity audit trails

## Configuration

### Environment Variables (Backend)
```env
# Flutterwave
FLUTTERWAVE_SECRET_KEY=your_secret_key
FLUTTERWAVE_PUBLIC_KEY=your_public_key

# Twilio (WhatsApp)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+1234567890

# Email
MAIL_DRIVER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_USERNAME=your_username
MAIL_PASSWORD=your_password
```

## Usage Examples

### Frontend Usage
```typescript
import { 
  ApplicationForm, 
  AdmissionBoardDashboard, 
  RegistrarDashboard, 
  NotificationBell 
} from '@/modules/admissions';

// In your router
<Route path="/admissions/apply" element={<ApplicationForm />} />
<Route path="/admissions/board" element={<AdmissionBoardDashboard />} />
<Route path="/admissions/registrar" element={<RegistrarDashboard />} />

// In header/navbar
<NotificationBell />
```

### Backend Usage
```php
use App\Modules\Admissions\Models\Application;
use App\Modules\Admissions\Services\AdmissionLetterService;
use App\Modules\Admissions\Services\PaymentService;

// Generate admission letter
$letterService = new AdmissionLetterService();
$pdfPath = $letterService->generateAdmissionLetter($application);

// Initialize payment
$paymentService = new PaymentService();
$paymentLink = $paymentService->initializePayment($application);
```

## Workflow Diagram

```
Applicant
    ↓
Create Account → Personal Info Form
    ↓
Submit Application → Select Programme & Year
    ↓
Upload Documents → Pay Application Fee
    ↓
Admission Board → Review Applications
    ↓
Board Decision → Approve/Reject
    ↓
If Approved:
    ↓
Registrar → Generate Admission Letter
    ↓
Send Notifications → Email + WhatsApp
    ↓
Student → Accept Admission
    ↓
Create Student Account
    ↓
Register Courses
    ↓
HOD → Approve Course Registration
    ↓
Enrollment Complete
```

## Security Considerations

1. **Authentication**: All endpoints require API token authentication
2. **Authorization**: Role-based access control for board and registrar functions
3. **Validation**: Input validation on all forms and requests
4. **File Upload**: Secure file upload with file type validation
5. **Payment**: Secure Flutterwave integration with webhook verification
6. **Soft Deletes**: All records support soft deletes for data recovery

## Future Enhancements

1. SMS notifications integration
2. Student admission letter customization
3. Bulk admission processing
4. Advanced filtering and search
5. Admission analytics and reporting
6. Document verification system
7. Interview scheduling
8. Appeal process management
9. Waitlist management
10. Multi-year admission cycles

## Support

For issues or questions regarding the Admissions Module, please contact the development team or refer to the main project documentation.
