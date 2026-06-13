<?php

namespace App\Modules\Canteen\Services;

use App\Institution;
use App\LetterSetting;
use App\Modules\Canteen\Models\CanteenOrder;
use App\Services\Letters\LetterAssetHelper;
use Carbon\Carbon;
use Dompdf\Dompdf;
use Dompdf\Options;

class CanteenInvoiceService
{
    public function assignInvoiceNumber(CanteenOrder $order): CanteenOrder
    {
        if ($order->invoice_number) {
            return $order;
        }

        $order->invoice_number = sprintf(
            'CINV-%d-%s-%04d',
            $order->institution_id,
            now()->format('Ymd'),
            $order->id
        );
        $order->save();

        return $order;
    }

    public function prepareOrder(CanteenOrder $order): CanteenOrder
    {
        $this->assignInvoiceNumber($order);

        return $order->fresh(['items.meal', 'payments', 'student.user', 'student.programme', 'institution', 'servedBy']);
    }

    public function buildViewData(CanteenOrder $order, ?\Illuminate\Http\Request $request = null): array
    {
        $order->loadMissing(['items.meal', 'payments', 'student.user', 'student.programme', 'institution', 'servedBy']);

        $institution = $order->institution;
        $settings = $institution
            ? LetterSetting::where('institution_id', $institution->id)->first()
            : null;

        $letterheadSource = optional($settings)->letterhead_path
            ?: optional($institution)->letterhead
            ?: optional($institution)->letterhead_path;

        $logoSource = optional($settings)->logo_path
            ?: optional($institution)->logo
            ?: optional($institution)->logo_path;

        $footerSource = optional($institution)->footer
            ?: optional($institution)->official_stamp;

        $invoiceNo = $order->invoice_number ?: $order->order_number;

        return [
            'order' => $order,
            'institution' => $institution,
            'student' => $order->student,
            'items' => $order->items,
            'payments' => $order->payments,
            'current_date' => Carbon::now()->format('d F Y H:i'),
            'letterhead_path' => LetterAssetHelper::pdfDataUri($letterheadSource),
            'letterhead_url' => LetterAssetHelper::url($letterheadSource, $request),
            'footer_path' => LetterAssetHelper::pdfDataUri($footerSource),
            'footer_url' => LetterAssetHelper::url($footerSource, $request),
            'logo_path' => LetterAssetHelper::pdfDataUri($logoSource),
            'logo_url' => LetterAssetHelper::url($logoSource, $request),
            'barcode_url' => 'https://barcode.tec-it.com/barcode.ashx?data='.urlencode($invoiceNo).'&code=Code128&translate-esc=on&dpi=96',
            'currency' => strtoupper((string) (optional($institution)->currency ?? 'USD')),
        ];
    }

    public function renderReceiptHtml(CanteenOrder $order, ?\Illuminate\Http\Request $request = null): string
    {
        return view('canteen.receipt', $this->buildViewData($order, $request))->render();
    }

    public function renderInvoicePdf(CanteenOrder $order, ?\Illuminate\Http\Request $request = null): string
    {
        $html = view('canteen.invoice', $this->buildViewData($order, $request))->render();

        $options = new Options();
        $options->set('isRemoteEnabled', true);
        $options->set('defaultFont', 'Helvetica');
        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4');
        $dompdf->render();

        return $dompdf->output();
    }
}
