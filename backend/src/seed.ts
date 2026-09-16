import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { UsersService } from './users/users.service.js';
import { CategoriesService } from './categories/categories.service.js';
import { Role } from './common/role.enum.js';

const DEFAULT_CATEGORIES = [
  { name: 'Tutoriales en video', order: 1 },
  { name: 'Documentos', order: 2 },
  { name: 'Formatos de calidad', order: 3 },
];

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const usersService = app.get(UsersService);
  const categoriesService = app.get(CategoriesService);

  const adminUsername = process.env.SEED_ADMIN_USERNAME ?? 'admin';
  const existing = await usersService.findByUsername(adminUsername);
  if (!existing) {
    await usersService.create({
      username: adminUsername,
      password: process.env.SEED_ADMIN_PASSWORD ?? 'admin123',
      fullName: process.env.SEED_ADMIN_FULLNAME ?? 'Administrador',
      role: Role.Admin,
    });
    console.log(`Usuario admin "${adminUsername}" creado.`);
  } else {
    console.log(`Usuario admin "${adminUsername}" ya existe.`);
  }

  const categories = await categoriesService.findAll(true);
  if (categories.length === 0) {
    for (const cat of DEFAULT_CATEGORIES) {
      await categoriesService.create(cat);
    }
    console.log('Categorías por defecto creadas.');
  } else {
    console.log('Categorías ya existentes, se omitió el seed.');
  }

  await app.close();
}

await run();
