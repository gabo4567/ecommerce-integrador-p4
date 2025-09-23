# 🛒 E-commerce Integrador P4

## 📖 Descripción del Proyecto
Este proyecto es un **sistema de e-commerce simplificado**, desarrollado como Trabajo Práctico Integrador de la materia **Programación IV**.  
Combina gestión de usuarios, productos, pedidos y recomendaciones de contenido mediante un **microservicio de IA**.

El objetivo es contar con un sistema **funcional, modular y escalable**, cumpliendo con los requisitos de ambos profesores:

- Gestión completa de usuarios, productos y pedidos  
- Autenticación JWT con roles y permisos  
- Comunicación en tiempo real para notificaciones  
- Microservicio de IA para recomendaciones o clasificaciones  
- Contenerización y despliegue en la nube mediante Docker

---

## 🛠️ Tecnologías Utilizadas

**Backend Python / Django**
- Python 3.x 🐍
- Django / Django REST Framework (DRF)
- FastAPI (microservicio IA)
- PostgreSQL 🐘

**Backend Node / Express**
- Node.js ⚡
- Express.js
- MongoDB Atlas 🍃
- Socket.IO
- Firebase Realtime Database 🔔

**DevOps / Despliegue**
- Docker / Docker Compose 🐳
- CI/CD (GitHub Actions) 🔧
- Variables de entorno para credenciales y configuraciones 🔐

## 📂 Estructura del Proyecto

ecommerce-integrador-p4/
│── README.md
│── .gitignore
│── docker-compose.yml
│── .env.example
│── docs/ 📝
│
├── backend-python/ 🐍
│ ├── manage.py
│ ├── requirements.txt
│ ├── Dockerfile
│ ├── src/
│ ├── ecommerce/
│ ├── apps/
│ ├── users/
│ ├── products/
│ ├── orders/
│ └── fastapi-ia/ ⚡
│ ├── app.py
│ ├── requirements.txt
│ └── Dockerfile
│
├── backend-node/ ⚡
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
├── database/ 🗄️
│ ├── postgres/
│ │ └── init.sql
│ └── mongo/
│ └── init.js
│
└── ci-cd/ ⚙️
└── deploy.yml


---

## 🚀 Cómo Ejecutar el Proyecto

1. **Clonar el repositorio**

git clone https://github.com/TuUsuario/ecommerce-integrador-p4.git
cd ecommerce-integrador-p4
Crear archivo de variables de entorno

cp .env.example .env
# Editar .env con tus credenciales y configuraciones
Levantar todos los servicios con Docker


docker-compose up --build
Acceder a los backends

Backend Python / Django: http://localhost:8000/

Backend Node / Express: http://localhost:3000/

Pruebas y documentación

Swagger estará disponible en los endpoints de cada API

Probar CRUD, autenticación y comunicación en tiempo real

## 👥 Colaboración y Buenas Prácticas

Para que el equipo trabaje de manera coordinada y segura:

- Antes de empezar a trabajar cada día:
```
git pull origin main
```

Al finalizar tu tarea diaria:

```
git add .
git commit -m "Mensaje claro: ej. Added login endpoint"
git push origin main
```

Coordinar diariamente qué carpeta o microservicio tocará cada integrante para evitar conflictos.

Cada integrante puede agregar README específicos en subcarpetas (backend-python/README.md, backend-node/README.md) si lo considera útil.

## 👥 Equipo y Roles Sugeridos

👨‍💻 Juan Gabriel Pared – Coordinador y backend Python / Django

👨‍💻 Enzo Rios – Backend Node / Express y sockets

👨‍💻 Leonel Fernandez – Base de datos (PostgreSQL y MongoDB)

👨‍💻 Juan Francisco Bartlett – Microservicio IA con FastAPI y comunicación en tiempo real


## 📝 Notas Finales
Este proyecto está diseñado para un mes de desarrollo colaborativo, priorizando un sistema funcional y modular sobre implementar todas las funciones avanzadas.

Se busca cumplir los requerimientos mínimos de ambos profesores, con una arquitectura clara y documentación profesional.

Los íconos y la organización ayudan a que el repositorio sea visual y fácil de entender para cualquier nuevo integrante o evaluador.

## 📄 Licencia

Este proyecto es para **fines educativos** y **no tiene licencia comercial**.


🔗 Enlaces Útiles
GitHub del proyecto

Documentación Swagger disponible en cada backend cuando se levanten los servicios.
