import { ar } from 'date-fns/locale';

const tunisianMonths = [
  'جانفي',  // Jan
  'فيفري',  // Feb
  'مارس',   // Mar
  'أفريل',  // Apr
  'ماي',    // May
  'جوان',   // Jun
  'جويلية', // Jul
  'أوت',    // Aug
  'سبتمبر', // Sep
  'أكتوبر', // Oct
  'نوفمبر', // Nov
  'ديسمبر'  // Dec
];

if (ar && ar.localize) {
  if (ar.localize.month) {
    ar.localize.month = (dirtyIndex: any, options: any) => {
      const index = Number(dirtyIndex);
      const width = options?.width || 'wide';
      if (width === 'narrow') {
        const narrowMonths = ['ج', 'ف', 'م', 'أ', 'م', 'ج', 'ج', 'أ', 'س', 'أ', 'ن', 'د'];
        return narrowMonths[index];
      }
      return tunisianMonths[index];
    };
  }
}
