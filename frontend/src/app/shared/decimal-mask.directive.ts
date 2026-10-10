import { Directive, ElementRef, forwardRef, HostListener, Input, Renderer2 } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

type DecimalMaskMode = 'currency' | 'percentage' | 'integer';

@Directive({
  selector: 'input[appDecimalMask]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DecimalMaskDirective),
      multi: true
    }
  ]
})
export class DecimalMaskDirective implements ControlValueAccessor {
  @Input() appDecimalMask: DecimalMaskMode = 'percentage';

  private value: number | null = null;
  private onChange: (value: number | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor(
    private readonly elementRef: ElementRef<HTMLInputElement>,
    private readonly renderer: Renderer2
  ) {}

  writeValue(value: unknown): void {
    const parsed = typeof value === 'number' ? value : Number(value);
    this.value = value === null || value === undefined || value === '' || !Number.isFinite(parsed)
      ? null
      : parsed;
    this.renderFormatted();
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.renderer.setProperty(this.elementRef.nativeElement, 'disabled', disabled);
  }

  @HostListener('focus')
  handleFocus(): void {
    this.renderEditable();
    this.elementRef.nativeElement.select();
  }

  @HostListener('input', ['$event.target.value'])
  handleInput(rawValue: string): void {
    const sanitized = this.sanitize(rawValue);
    this.renderer.setProperty(this.elementRef.nativeElement, 'value', sanitized);
    this.value = this.parse(sanitized);
    this.onChange(this.value);
  }

  @HostListener('blur')
  handleBlur(): void {
    this.onTouched();
    this.renderFormatted();
  }

  private sanitize(rawValue: string): string {
    return this.appDecimalMask === 'integer'
      ? rawValue.replace(/\D/g, '')
      : rawValue.replace(/[^\d,.]/g, '');
  }

  private parse(rawValue: string): number | null {
    if (!rawValue) {
      return null;
    }

    if (this.appDecimalMask === 'integer') {
      const integer = Number(rawValue);
      return Number.isFinite(integer) ? Math.trunc(integer) : null;
    }

    let normalized = rawValue;

    if (normalized.includes(',')) {
      normalized = normalized.replace(/\./g, '').replace(',', '.');
    } else {
      const dotParts = normalized.split('.');
      const isDecimalDot = dotParts.length === 2 && dotParts[1].length <= 2;
      normalized = isDecimalDot ? normalized : normalized.replace(/\./g, '');
    }

    const decimal = Number(normalized);
    return Number.isFinite(decimal) ? decimal : null;
  }

  private renderEditable(): void {
    if (this.value === null) {
      this.renderer.setProperty(this.elementRef.nativeElement, 'value', '');
      return;
    }

    const value = this.appDecimalMask === 'integer'
      ? String(Math.trunc(this.value))
      : new Intl.NumberFormat('pt-BR', {
          useGrouping: false,
          maximumFractionDigits: 2
        }).format(this.value);

    this.renderer.setProperty(this.elementRef.nativeElement, 'value', value);
  }

  private renderFormatted(): void {
    if (this.value === null) {
      this.renderer.setProperty(this.elementRef.nativeElement, 'value', '');
      return;
    }

    if (this.appDecimalMask === 'integer') {
      this.renderer.setProperty(this.elementRef.nativeElement, 'value', String(Math.trunc(this.value)));
      return;
    }

    const options: Intl.NumberFormatOptions = this.appDecimalMask === 'currency'
      ? { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }
      : { minimumFractionDigits: 2, maximumFractionDigits: 2 };

    this.renderer.setProperty(
      this.elementRef.nativeElement,
      'value',
      new Intl.NumberFormat('pt-BR', options).format(this.value)
    );
  }
}
