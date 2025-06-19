import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const introBlockGuard: CanActivateFn = (route, state) => {
  const hasSeenIntro = localStorage.getItem('hasSeenIntro');
  const router = inject(Router);
  if (!hasSeenIntro) {
    router.navigateByUrl('/intro');
    return false;
  }
  return true;
};
