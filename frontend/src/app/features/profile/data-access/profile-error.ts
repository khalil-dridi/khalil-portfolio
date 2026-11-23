import { HttpErrorResponse } from '@angular/common/http';

export function profileErrorMessage(error: unknown, context: 'read' | 'save' | 'upload' | 'delete'): string {
  if (!(error instanceof HttpErrorResponse)) {
    return context === 'read'
      ? 'Impossible de charger les informations du profil.'
      : 'Une erreur inattendue est survenue. Veuillez réessayer.';
  }

  switch (error.status) {
    case 0:
      return 'Le serveur est injoignable. Vérifiez votre connexion puis réessayez.';
    case 400:
      return context === 'save'
        ? 'Certaines informations sont invalides. Vérifiez les champs et réessayez.'
        : 'La demande n’a pas pu être traitée.';
    case 401:
      return 'Votre session a expiré. Reconnectez-vous pour continuer.';
    case 403:
      return 'Vous n’avez pas les droits nécessaires pour effectuer cette action.';
    case 404:
      return context === 'delete'
        ? 'Le profil ou son image est introuvable.'
        : 'Les informations du profil sont introuvables.';
    case 413:
      return 'Cette image dépasse la limite autorisée de 5 Mio.';
    case 415:
      return 'Format non pris en charge. Choisissez une image JPG, PNG ou WebP.';
    case 500:
      return context === 'upload' || context === 'delete'
        ? 'Le stockage de l’image a échoué. Réessayez plus tard.'
        : 'Le serveur n’a pas pu traiter la demande. Réessayez plus tard.';
    default: {
      return context === 'read'
        ? 'Impossible de charger les informations du profil.'
        : 'Une erreur est survenue. Veuillez réessayer.';
    }
  }
}
