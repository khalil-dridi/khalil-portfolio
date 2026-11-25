import { Routes } from '@angular/router';
import { routes } from './app.routes';

describe('application lazy routes', () => {
  it('resolves every configured lazy child and component destination', async () => {
    const componentNames: string[] = [];

    const resolveRoutes = async (routeList: Routes): Promise<void> => {
      for (const route of routeList) {
        if (route.loadComponent) {
          const component = await route.loadComponent();
          componentNames.push(((component as { name?: string }).name ?? '').replace(/\d+$/, ''));
        }

        let children = route.children;
        if (route.loadChildren) children = await route.loadChildren() as Routes;
        if (children) await resolveRoutes(children);
      }
    };

    await resolveRoutes(routes);

    expect(componentNames).toEqual(jasmine.arrayContaining([
      'PublicLayout', 'Home', 'About', 'Career', 'Projects', 'ProjectDetails', 'Contact',
      'Login', 'AdminLayout', 'Profile', 'AdminProjects', 'AdminCareer', 'NotFound',
    ]));
  });
});
