# Proyecto de Gestión de Ventas

Este proyecto tiene como objetivo desarrollar un sistema de gestión de ventas para pequeñas y medianas empresas. El sistema permite llevar un control detallado de las ventas, inventarios y clientes.

## Funcionalidades

- **Gestión de Inventarios**: Permite registrar y actualizar la información de los productos en inventario.
- **Registro de Ventas**: Facilita la creación y seguimiento de facturas de ventas.
- **Control de Clientes**: Gestiona la información de los clientes, incluyendo historial de compras.
- **Reportes**: Genera reportes de ventas y de inventarios para análisis detallados.

## Requisitos

- Python 3.8 o superior
- Django 3.2 o superior
- Base de datos PostgreSQL

## Instalación

1. Clonar el repositorio:
    ```bash
    git clone https://github.com/tu_usuario/gestion-ventas.git
    ```
2. Navegar al directorio del proyecto:
    ```bash
    cd gestion-ventas
    ```
3. Crear un entorno virtual:
    ```bash
    python3 -m venv env
    ```
4. Activar el entorno virtual:
    - En Windows:
      ```bash
      .\env\Scripts\activate
      ```
    - En MacOS/Linux:
      ```bash
      source env/bin/activate
      ```
5. Instalar las dependencias:
    ```bash
    pip install -r requirements.txt
    ```
6. Configurar la base de datos en el archivo `settings.py` de Django.
7. Aplicar las migraciones:
    ```bash
    python manage.py migrate
    ```
8. Ejecutar el servidor de desarrollo:
    ```bash
    python manage.py runserver
    ```

## Uso

Una vez instalado y configurado el proyecto, puedes acceder a la aplicación a través de `http://localhost:8000` en tu navegador web. Desde allí, puedes navegar por las diferentes secciones del sistema y utilizar sus funcionalidades.

## Contribuciones

Las contribuciones son bienvenidas. Para contribuir, sigue estos pasos:

1. Haz un fork del proyecto.
2. Crea una nueva rama (`git checkout -b nueva-rama`).
3. Realiza los cambios necesarios y haz commit (`git commit -m 'Descripción de los cambios'`).
4. Sube los cambios a tu repositorio (`git push origin nueva-rama`).
5. Abre un Pull Request.

## Licencia

Este proyecto está licenciado bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para obtener más información.
