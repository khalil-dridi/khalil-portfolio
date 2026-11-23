import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { appConfig } from './app.config';
import { routes } from './app.routes';

describe('application configuration', () => {
  it('registers the application route tree with Angular Router', () => {
    TestBed.configureTestingModule({ providers: appConfig.providers });
    expect(TestBed.inject(Router).config.map((route) => route.path)).toEqual(routes.map((route) => route.path));
  });
});
