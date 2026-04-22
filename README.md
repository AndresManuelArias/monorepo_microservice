
## Create docker
```sh
cd medical
docker compose up -d
```

## Run proyect
```sh
cd medical
npx nx run-many --target=serve
```

## swagger documentation

gateway
<a href="http://localhost:3000/docs"> http://localhost:3000/docs </a>

auth
<a href="http://localhost:3001/docs"> http://localhost:3001/docs </a>

document
<a href="http://localhost:3002/docs"> http://localhost:3002/docs </a>



# Decisiones Técnicas y Arquitectura - Sistema de Gestión Médica

Este documento resume los pilares técnicos sobre los cuales construí la solución, priorizando la escalabilidad, el desacoplamiento y la seguridad de la información sensible.

## 1. Arquitectura de Microservicios con Nx Monorepo
Para la gestión del proyecto, opté por un **monorepo utilizando Nx**. Esta decisión no fue solo por organización, sino por eficiencia técnica:
* **Librerías Compartidas:** Centralicé la lógica común en librerías (`shared-dto`, `auth-guard`, `database`). Esto garantiza que todos los microservicios sigan las mismas reglas de negocio sin duplicar código.
* **Escalabilidad Independiente:** Dividí el dominio en servicios específicos (`auth`, `document`, `gateway`). Esto permite que cada módulo crezca o se despliegue según sus propias necesidades de carga.

<img src="./uml/image.png" alt="Arquitectura del Sistema" />

## 2. Backend For Frontend (BFF) vía Gateway
Implementé un **Gateway** como punto único de entrada para el frontend.
* **Simplicidad en el Cliente:** El frontend no necesita conocer la topología de la red interna; solo interactúa con una URL.
* **Seguridad Perimetral:** El Gateway actúa como primer filtro, validando los tokens JWT y protegiendo los microservicios internos de peticiones no autorizadas.

## 3. Gestión de Archivos con MinIO (S3)
En lugar de depender del sistema de archivos local, decidí implementar **Object Storage con MinIO**.
* **Privacidad por Diseño (Requisito 3.3):** Implementé el uso de **URLs Firmadas**. Los documentos clínicos nunca son públicos; el sistema genera un acceso temporal que expira en 5 minutos.
* **Persistencia Desacoplada:** Esto separa los metadatos de los archivos físicos, facilitando migraciones y copias de seguridad.

## 4. Seguridad e Integridad de Datos
La seguridad es el eje central, considerando que manejamos datos médicos:
* **Hashing Robusto:** Uso de **Bcrypt** para asegurar que ninguna credencial se almacene en texto plano.
* **Validación de Capas:**
    * **Tipado Estricto:** Uso de `class-validator` y `class-transformer` en los DTOs para asegurar que solo entre data limpia al sistema.
    * **Enums Médicos:** Definición de tipos estrictos para documentos (`Concepto médico`, `Paraclínicos`, etc.) para evitar inconsistencias.
* **Validación de Propiedad:** El sistema no solo verifica que el usuario esté logueado, sino que cruza el `patient_id` del token con el dueño del recurso solicitado para prevenir accesos cruzados.

## 5. Persistencia con PostgreSQL
Elegí PostgreSQL por su robustez y su excelente soporte para datos complejos:
* **UUIDs:** Implementé identificadores universales para evitar la enumeración de recursos y mejorar la seguridad por oscuridad en las URLs.
* **Flexibilidad con JSONB:** Utilicé el tipo de datos `JSONB` para el campo de metadatos de los documentos. Esto permite almacenar información clínica variable sin comprometer el rendimiento de las consultas.
# Medical

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

✨ Your new, shiny [Nx workspace](https://nx.dev) is ready ✨.

[Learn more about this workspace setup and its capabilities](https://nx.dev/nx-api/nest?utm_source=nx_project&amp;utm_medium=readme&amp;utm_campaign=nx_projects) or run `npx nx graph` to visually explore what was created. Now, let's get you up to speed!

## Run tasks

To run the dev server for your app, use:

```sh
npx nx serve gateway
```

To create a production bundle:

```sh
npx nx build gateway
```

To see all available targets to run for a project, run:

```sh
npx nx show project gateway
```

These targets are either [inferred automatically](https://nx.dev/concepts/inferred-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or defined in the `project.json` or `package.json` files.

[More about running tasks in the docs &raquo;](https://nx.dev/features/run-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Add new projects

While you could add new projects to your workspace manually, you might want to leverage [Nx plugins](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) and their [code generation](https://nx.dev/features/generate-code?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) feature.

Use the plugin's generator to create new projects.

To generate a new application, use:

```sh
npx nx g @nx/nest:app demo
```

To generate a new library, use:

```sh
npx nx g @nx/node:lib mylib
```

You can use `npx nx list` to get a list of installed plugins. Then, run `npx nx list <plugin-name>` to learn about more specific capabilities of a particular plugin. Alternatively, [install Nx Console](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) to browse plugins and generators in your IDE.

[Learn more about Nx plugins &raquo;](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) | [Browse the plugin registry &raquo;](https://nx.dev/plugin-registry?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Set up CI!

### Step 1

To connect to Nx Cloud, run the following command:

```sh
npx nx connect
```

Connecting to Nx Cloud ensures a [fast and scalable CI](https://nx.dev/ci/intro/why-nx-cloud?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) pipeline. It includes features such as:

- [Remote caching](https://nx.dev/ci/features/remote-cache?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task distribution across multiple machines](https://nx.dev/ci/features/distribute-task-execution?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Automated e2e test splitting](https://nx.dev/ci/features/split-e2e-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task flakiness detection and rerunning](https://nx.dev/ci/features/flaky-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

### Step 2

Use the following command to configure a CI workflow for your workspace:

```sh
npx nx g ci-workflow
```

[Learn more about Nx on CI](https://nx.dev/ci/intro/ci-with-nx#ready-get-started-with-your-provider?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Install Nx Console

Nx Console is an editor extension that enriches your developer experience. It lets you run tasks, generate code, and improves code autocompletion in your IDE. It is available for VSCode and IntelliJ.

[Install Nx Console &raquo;](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Useful links

Learn more:

- [Learn more about this workspace setup](https://nx.dev/nx-api/nest?utm_source=nx_project&amp;utm_medium=readme&amp;utm_campaign=nx_projects)
- [Learn about Nx on CI](https://nx.dev/ci/intro/ci-with-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Releasing Packages with Nx release](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [What are Nx plugins?](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

And join the Nx community:
- [Discord](https://go.nx.dev/community)
- [Follow us on X](https://twitter.com/nxdevtools) or [LinkedIn](https://www.linkedin.com/company/nrwl)
- [Our Youtube channel](https://www.youtube.com/@nxdevtools)
- [Our blog](https://nx.dev/blog?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)


testing
```sh
npx nx test auth --skip-nx-cache
npx nx test gateway --skip-nx-cache

``