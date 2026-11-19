import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: '<main><h1>Page introuvable</h1><a routerLink="/">Retour à l’accueil</a></main>',
})
export class NotFound {}
