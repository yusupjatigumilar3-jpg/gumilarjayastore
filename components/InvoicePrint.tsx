import type { Invoice, InvoiceItem, InvoiceCustomerInfo } from '@/lib/types';
import InvoicePrintV3 from './InvoicePrintV3';
import InvoicePrintV4 from './InvoicePrintV4';
import FitToA4 from './FitToA4';

interface Props {
  invoice: Invoice & { customer_id_display?: string };
  items: InvoiceItem[];
  settings: Record<string, string>;
  publicUrl?: string;
  customer?: InvoiceCustomerInfo;
}

export default function InvoicePrint(props: Props) {
  const template = props.settings.invoice_template || 'v3';
  return (
    <div className="a4-fit">
      <FitToA4 />
      {template === 'v4' ? <InvoicePrintV4 {...props} /> : <InvoicePrintV3 {...props} />}
    </div>
  );
}