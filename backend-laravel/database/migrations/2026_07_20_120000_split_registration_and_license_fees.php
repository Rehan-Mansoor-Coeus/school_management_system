<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SplitRegistrationAndLicenseFees extends Migration
{
    public function up()
    {
        if (Schema::hasTable('general_settings')) {
            Schema::table('general_settings', function (Blueprint $table) {
                if (! Schema::hasColumn('general_settings', 'per_student_license_fee')) {
                    $table->decimal('per_student_license_fee', 12, 2)->default(0)->after('student_registration_fee');
                }
                if (! Schema::hasColumn('general_settings', 'per_student_license_currency')) {
                    $table->string('per_student_license_currency', 10)->default('USD')->after('per_student_license_fee');
                }
                if (! Schema::hasColumn('general_settings', 'per_student_license_period')) {
                    $table->string('per_student_license_period')->default('per_semester')->after('per_student_license_currency');
                }
            });

            // Seed license fee columns from legacy registration columns where empty.
            if (Schema::hasColumn('general_settings', 'student_registration_fee')) {
                DB::table('general_settings')->orderBy('id')->get()->each(function ($row) {
                    $updates = [];
                    if ((float) ($row->per_student_license_fee ?? 0) <= 0 && isset($row->student_registration_fee)) {
                        $updates['per_student_license_fee'] = $row->student_registration_fee;
                    }
                    if (empty($row->per_student_license_currency) && ! empty($row->registration_fee_currency)) {
                        $updates['per_student_license_currency'] = $row->registration_fee_currency;
                    }
                    if (empty($row->per_student_license_period) && ! empty($row->registration_fee_period)) {
                        $updates['per_student_license_period'] = $row->registration_fee_period;
                    }
                    if (! empty($updates)) {
                        DB::table('general_settings')->where('id', $row->id)->update($updates);
                    }
                });
            }
        }

        if (Schema::hasTable('institution_settings')) {
            Schema::table('institution_settings', function (Blueprint $table) {
                if (! Schema::hasColumn('institution_settings', 'student_registration_fee')) {
                    $table->decimal('student_registration_fee', 12, 2)->nullable()->after('payment_settings');
                }
                if (! Schema::hasColumn('institution_settings', 'registration_fee_currency')) {
                    $table->string('registration_fee_currency', 10)->nullable()->after('student_registration_fee');
                }
                if (! Schema::hasColumn('institution_settings', 'registration_fee_period')) {
                    $table->string('registration_fee_period', 50)->nullable()->after('registration_fee_currency');
                }
            });

            $global = Schema::hasTable('general_settings')
                ? DB::table('general_settings')->orderBy('id')->first()
                : null;

            $institutions = DB::table('institutions')->select('id', 'currency')->get();
            foreach ($institutions as $institution) {
                $settings = DB::table('institution_settings')->where('institution_id', $institution->id)->first();
                if (! $settings) {
                    continue;
                }

                $fee = $settings->student_registration_fee;
                $currency = $settings->registration_fee_currency;
                $period = $settings->registration_fee_period;

                if (($fee === null || (float) $fee <= 0) && is_string($settings->fee_structure)) {
                    $structure = json_decode($settings->fee_structure, true);
                    if (is_array($structure)) {
                        $items = isset($structure['fees']) && is_array($structure['fees']) ? $structure['fees'] : $structure;
                        foreach ($items as $item) {
                            if (is_array($item) && ($item['key'] ?? '') === 'registration_fee') {
                                $fee = (float) ($item['amount'] ?? 0);
                                break;
                            }
                        }
                    }
                }

                if (($fee === null || (float) $fee <= 0) && $global) {
                    $fee = $global->student_registration_fee ?? null;
                    $period = $period ?: ($global->registration_fee_period ?? null);
                }

                $currency = $currency ?: ($institution->currency ?: ($global->registration_fee_currency ?? 'USD'));

                DB::table('institution_settings')->where('id', $settings->id)->update([
                    'student_registration_fee' => $fee !== null ? $fee : 0,
                    'registration_fee_currency' => $currency,
                    'registration_fee_period' => $period ?: 'per_semester',
                ]);
            }
        }
    }

    public function down()
    {
        if (Schema::hasTable('institution_settings')) {
            Schema::table('institution_settings', function (Blueprint $table) {
                if (Schema::hasColumn('institution_settings', 'registration_fee_period')) {
                    $table->dropColumn('registration_fee_period');
                }
                if (Schema::hasColumn('institution_settings', 'registration_fee_currency')) {
                    $table->dropColumn('registration_fee_currency');
                }
                if (Schema::hasColumn('institution_settings', 'student_registration_fee')) {
                    $table->dropColumn('student_registration_fee');
                }
            });
        }

        if (Schema::hasTable('general_settings')) {
            Schema::table('general_settings', function (Blueprint $table) {
                if (Schema::hasColumn('general_settings', 'per_student_license_period')) {
                    $table->dropColumn('per_student_license_period');
                }
                if (Schema::hasColumn('general_settings', 'per_student_license_currency')) {
                    $table->dropColumn('per_student_license_currency');
                }
                if (Schema::hasColumn('general_settings', 'per_student_license_fee')) {
                    $table->dropColumn('per_student_license_fee');
                }
            });
        }
    }
}
