import { HttpErrorResponse } from '@angular/common/http';
import { profileErrorMessage } from './profile-error';

describe('profileErrorMessage', () => {
  const httpError = (status: number) => new HttpErrorResponse({ status });

  it('maps connectivity, validation, authentication and permission errors', () => {
    expect(profileErrorMessage(httpError(0), 'read')).toContain('injoignable');
    expect(profileErrorMessage(httpError(400), 'save')).toContain('informations sont invalides');
    expect(profileErrorMessage(httpError(400), 'upload')).toContain('demande n’a pas pu être traitée');
    expect(profileErrorMessage(httpError(401), 'read')).toContain('session a expiré');
    expect(profileErrorMessage(httpError(403), 'delete')).toContain('droits nécessaires');
  });

  it('uses context-specific messages for missing resources and server errors', () => {
    expect(profileErrorMessage(httpError(404), 'read')).toContain('informations du profil sont introuvables');
    expect(profileErrorMessage(httpError(404), 'delete')).toContain('profil ou son image est introuvable');
    expect(profileErrorMessage(httpError(413), 'upload')).toContain('5 Mio');
    expect(profileErrorMessage(httpError(415), 'upload')).toContain('JPG, PNG ou WebP');
    expect(profileErrorMessage(httpError(500), 'read')).toContain('serveur n’a pas pu traiter');
    expect(profileErrorMessage(httpError(500), 'upload')).toContain('stockage de l’image a échoué');
    expect(profileErrorMessage(httpError(500), 'delete')).toContain('stockage de l’image a échoué');
  });

  it('handles unknown HTTP statuses and non-HTTP errors', () => {
    expect(profileErrorMessage(httpError(418), 'read')).toContain('Impossible de charger');
    expect(profileErrorMessage(httpError(418), 'save')).toContain('Une erreur est survenue');
    expect(profileErrorMessage(new Error('offline'), 'read')).toContain('Impossible de charger');
    expect(profileErrorMessage('offline', 'upload')).toContain('erreur inattendue');
  });
});
