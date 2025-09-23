# E-commerce Integrador P4

## Descripción del Proyecto
Este proyecto es un **sistema de e-commerce simplificado** desarrollado como Trabajo Práctico Integrador de la materia Programación IV.  
Incluye funcionalidades de gestión de usuarios, productos, pedidos y recomendaciones de contenido mediante un microservicio de IA.  
El proyecto combina **backend en Python/Django**, **backend en NodeJS/Express**, bases de datos **PostgreSQL y MongoDB**, y comunicación en tiempo real con **Firebase y Socket.IO**.

El objetivo es tener un sistema funcional y modular que cumpla con los requerimientos de ambos profesores, permitiendo:  
- Gestión completa de usuarios, productos y pedidos  
- Autenticación JWT con roles y permisos  
- Comunicación en tiempo real para notificaciones  
- Microservicio de IA para generar recomendaciones o clasificaciones  
- Contenerización y despliegue en la nube mediante Docker  

---

## Tecnologías Utilizadas

**Backend Python / Django**
- Python 3.x
- Django
- Django REST Framework (DRF)
- FastAPI (microservicio IA)
- PostgreSQL

**Backend Node / Express**
- Node.js
- Express.js
- MongoDB Atlas
- Socket.IO
- Firebase Realtime Database

**DevOps / Despliegue**
- Docker / Docker Compose
- CI/CD (GitHub Actions o similar)
- Variables de entorno para credenciales y configuraciones

---

## Estructura del Proyecto

ecommerce-integrador-p4/
│── README.md
│── .gitignore
│── docker-compose.yml
│── .env.example
│── docs/
│
├── backend-python/
│ ├── manage.py
│ ├── requirements.txt
│ ├── Dockerfile
│ ├── src/
│ ├── ecommerce/
│ ├── apps/
│ ├── users/
│ ├── products/
│ ├── orders/
│ └── fastapi-ia/
│ ├── app.py
│ ├── requirements.txt
│ └── Dockerfile
│
├── backend-node/
│ ├── package.json
│ ├── Dockerfile
│ ├── src/
│ ├── app.js
│ ├── routes/
│ │ ├── reviews.js
│ │ ├── comments.js
│ │ └── auth.js
│ ├── models/
│ │ ├── Review.js
│ │ ├── Comment.js
│ │ └── User.js
│ └── sockets/
│ └── index.js
│
├── database/
│ ├── postgres/
│ │ └── init.sql
│ └── mongo/
│ └── init.js
│
└── ci-cd/
└── deploy.yml

yaml
Copiar código

---

## Cómo Ejecutar el Proyecto

1. **Clonar el repositorio**
```bash
git clone https://github.com/TuUsuario/ecommerce-integrador-p4.git
cd ecommerce-integrador-p4
Crear archivo de variables de entorno

bash
Copiar código
cp .env.example .env
# Editar .env con tus credenciales y configuraciones
Levantar todos los servicios con Docker

bash
Copiar código
docker-compose up --build
Acceder a los backends

Backend Python / Django: http://localhost:8000/

Backend Node / Express: http://localhost:3000/

Pruebas y documentación

Swagger estará disponible en los endpoints de cada API.

Realizar pruebas de CRUD, autenticación y comunicación en tiempo real.

Colaboración y Buenas Prácticas
Antes de trabajar cada día: git pull origin main

Al terminar tu tarea:

bash
Copiar código
git add .
git commit -m "Mensaje claro: ej. Added login endpoint"
git push origin main
Mantener coordinación diaria para no pisarse cambios.

Cada integrante puede crear README específicos en subcarpetas si lo considera necesario (ej. backend-python/README.md).

Autor y Equipo
Juan Gabriel Pared (Coordinador)

Integrante 2

Integrante 3

Integrante 4

Notas
Este proyecto está diseñado para un mes de desarrollo colaborativo con un enfoque funcional, modular y escalable, cumpliendo los requisitos mínimos de ambos profesores para entrega y presentación.
