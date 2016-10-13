import {
  Component,
  OnInit,
  Input,
  HostListener,
  forwardRef,
  SimpleChanges,
  OnChanges
} from '@angular/core';
import {ObCalendarComponent} from '../ob-calendar/ob-calendar.component';
import * as moment from 'moment';
import {Moment} from 'moment';
import {DayPickerService} from './service/day-picker.service';
import {IDayPickerConfig} from './service/day-picker-config.model';
import {ICalendarConfig} from '../ob-calendar/config/calendar-config.model';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {UtilsService} from '../common/services/utils/utils.service';
import {IObDayPickerApi} from './ob-day-picker.api';

@Component({
  selector: 'ob-day-picker',
  templateUrl: './ob-day-picker.component.html',
  styleUrls: ['./ob-day-picker.component.less'],
  entryComponents: [ObCalendarComponent],
  providers: [DayPickerService, {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => ObDayPickerComponent),
    multi: true
  }]
})
export class ObDayPickerComponent implements OnInit, OnChanges, ControlValueAccessor {
  @Input('config') private userConfig: IDayPickerConfig;
  @Input('value') private userValue: Moment | string;

  private areCalendarsShown: boolean = false;
  private hideStateHelper: boolean = false;
  private pickerConfig: IDayPickerConfig;
  private calendars: ICalendarConfig[];
  private value: Moment;
  private _viewValue: string;
  private get viewValue() {
    return this._viewValue;
  }

  private set viewValue(val) {
    this._viewValue = val;
    this.propagateChange(val);
  }

  api: IObDayPickerApi = <IObDayPickerApi>{};

  constructor(private dayPickerService: DayPickerService) {
    this.initListeners();
  }

  @HostListener('click', ['$event'])
  onClick(e: Event) {
    this.hideStateHelper = false;
    e.stopPropagation();
  }

  @HostListener('document:click')
  onBodyClick() {
    if (!this.hideStateHelper) {
      this.hideCalendars();
    }
    this.hideStateHelper = false;
  }

  ngOnInit(): void {
    this.init();
  }

  ngOnChanges(changes: SimpleChanges) {
    const {userValue} = changes;
    if (userValue && !userValue.isFirstChange()) {
      this.init();
    }
  }

  writeValue(value: Moment): void {
    this.viewValue = value.format(this.pickerConfig.format);
  }

  propagateChange(_: any) {
  };

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {
  }

  isDateValid(value: string) {
    if (this.dayPickerService.isDateValid(value, this.pickerConfig.format)) {
      this.value = moment(value, this.pickerConfig.format);
    }
  }

  // start
  init() {
    this.pickerConfig = this.dayPickerService.getConfig(this.userConfig, this.userValue);
    this.value = UtilsService.convertToMoment(this.userValue, this.pickerConfig.format);
    this.viewValue = this.value ? this.value.format(this.pickerConfig.format) : '';
    this.calendars = this.dayPickerService.generateCalendars(this.pickerConfig, this.value);
    this.initApi();
  }

  initListeners() {
  }

  initApi() {
    this.api = {
      open: this.showCalendars.bind(this),
      close: this.hideCalendars.bind(this)
    };
  }

  daySelected({day}) {
    this.value = day.date;
    this.viewValue = this.value.format(this.pickerConfig.format);

    if (this.pickerConfig.closeOnSelect) {
      setTimeout(this.hideCalendars.bind(this), this.pickerConfig.closeOnSelectDelay);
    }
  }

  showCalendars() {
    this.hideStateHelper = true;
    this.areCalendarsShown = true;
  }

  hideCalendars() {
    this.areCalendarsShown = false;
  }

  moveCalendars(base: Moment, months: number) {
    this.calendars = this.dayPickerService.moveCalendars(this.pickerConfig, this.value, base, months);
  }

  isLeftNavDisabled(month: Moment): boolean {
    return this.dayPickerService.isMinMonth(this.pickerConfig.min, month);
  }

  isRightNavDisabled(month: Moment): boolean {
    return this.dayPickerService.isMaxMonth(this.pickerConfig.max, month);
  }
}