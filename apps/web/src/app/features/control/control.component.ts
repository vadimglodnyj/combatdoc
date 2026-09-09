import { Component } from '@angular/core';

@Component({
  selector: 'app-control',
  template: `
    <h1>Контроль пацієнтів</h1>
    <nz-tabset>
      <nz-tab nzTitle="Стаціонар">Активні в стаціонарі</nz-tab>
      <nz-tab nzTitle="Поранені">COMBAT епізоди</nz-tab>
      <nz-tab nzTitle="Поліклініка">Поліклінічний список на дату</nz-tab>
      <nz-tab nzTitle="ВЛК">Черга на ВЛК</nz-tab>
      <nz-tab nzTitle="Довготривале">120+ днів</nz-tab>
      <nz-tab nzTitle="Нагадування">Дедлайни</nz-tab>
      <nz-tab nzTitle="Довідки">Довідка №5</nz-tab>
    </nz-tabset>
  `,
})
export class ControlComponent {}
