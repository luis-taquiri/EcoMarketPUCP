import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
const db = new PrismaClient();
async function main() {
  const people = [
    ["Mariana Flores", "mariana.demo@pucp.edu.pe", "EE.GG. Letras"],
    ["Diego Salazar", "diego.demo@pucp.edu.pe", "Arquitectura"],
    ["Lucía Ríos", "lucia.demo@pucp.edu.pe", "EE.GG. Ciencias"],
    ["Alejandro Vargas", "alejandro.demo@pucp.edu.pe", "Gestión"],
    ["Valeria Castro", "valeria.demo@pucp.edu.pe", "Ciencias e Ingeniería"],
    ["Marco Paredes", "marco.demo@pucp.edu.pe", "Arquitectura"],
  ];
  const passwordHash = await hash(process.env.DEMO_PASSWORD || "EcoCampus2026!", 12);
  const created = await db.$transaction(async (tx) => {
    const existing = await tx.user.count({
      where: { email: { in: people.map((person) => person[1]) } },
    });
    if (existing === people.length) {
      console.log("Las cuentas demo ya existen. No se duplican ni se modifica ningún dato.");
      return false;
    }
    if (existing > 0)
      throw new Error(
        "Ya existen algunos correos de la demo. No se modifica ningún dato; revisa esas cuentas antes de cargar los ejemplos.",
      );
    const users = [];
    for (const [name, email, faculty] of people)
      users.push(
        await tx.user.create({
          data: {
            name,
            email,
            faculty,
            passwordHash,
            cycle: "5.º ciclo",
            bio: "Cuenta de demostración. Materiales y actividad ficticios para probar EcoMarket.",
          },
        }),
      );
    const materials = [
      {
        title: "Lecturas de Realidad Peruana",
        category: "Impresos y apuntes",
        course: "Realidad Social Peruana",
        kind: "TRADE",
        image: "books.jpg",
        wanted: "Apuntes de Estadística o un libro de literatura.",
      },
      {
        title: "Kit de útiles de dibujo técnico",
        category: "Útiles de taller",
        course: "Dibujo Arquitectónico I",
        kind: "DONATION",
        image: "tools.jpg",
        wanted: "",
      },
      {
        title: "Prácticas de Cálculo Diferencial",
        category: "Impresos y apuntes",
        course: "Cálculo 1",
        kind: "TRADE",
        image: "notes.jpg",
        wanted: "Lecturas de Humanidades o apuntes de Física.",
      },
      {
        title: "Libro de Economía · Mankiw",
        category: "Libros",
        course: "Economía General",
        kind: "DONATION",
        image: "books.jpg",
        wanted: "",
      },
      {
        title: "Resúmenes de Estadística",
        category: "Impresos y apuntes",
        course: "Estadística Aplicada",
        kind: "TRADE",
        image: "statistics.jpg",
        wanted: "Lecturas de Realidad Peruana.",
      },
      {
        title: "Materiales para maqueta",
        category: "Útiles de taller",
        course: "Taller de Diseño",
        kind: "DONATION",
        image: "tools.jpg",
        wanted: "",
      },
    ];
    const listings = [];
    for (let i = 0; i < materials.length; i++) {
      const { image, ...m } = materials[i];
      listings.push(
        await tx.listing.create({
          data: {
            ...m,
            userId: users[i].id,
            faculty: users[i].faculty,
            condition: "Buen estado",
            description:
              "Material de demostración en buen estado. Incluye anotaciones y detalles de uso. Revisa las fotografías y conversa con la otra persona antes de acordar el intercambio. No se solicita dinero.",
            images: [`/demo/${image}`],
            location: "Biblioteca Central",
            createdAt: new Date(Date.now() - i * 3600000),
          },
        }),
      );
    }
    await tx.trade.create({
      data: {
        requesterId: users[4].id,
        receiverId: users[0].id,
        targetId: listings[0].id,
        offeredId: listings[4].id,
        meetingPlace: "Biblioteca Central",
        messages: {
          create: {
            userId: users[4].id,
            body: "¡Hola, Mariana! Tengo resúmenes de Estadística y me interesan tus lecturas. ¿Te gustaría intercambiarlos?",
          },
        },
      },
    });
    await tx.wanted.createMany({
      data: [
        {
          userId: users[0].id,
          title: "Busco lecturas impresas de Historia del Perú",
          description:
            "Me ayudaría tener lecturas del curso. Puedo ofrecer mis materiales publicados; no compro ni vendo.",
          faculty: users[0].faculty,
          category: "Impresos y apuntes",
          course: "Historia del Perú",
        },
        {
          userId: users[1].id,
          title: "Necesito una calculadora científica",
          description:
            "Busco una calculadora que ya no utilices para mis cursos. Podemos conversar y acordar un trueque.",
          faculty: users[1].faculty,
          category: "Tecnología",
          course: "Matemáticas",
        },
        {
          userId: users[3].id,
          title: "Busco libro de Derecho Constitucional",
          description:
            "Busco un ejemplar original usado en buen estado. Tengo materiales de Economía para ofrecer.",
          faculty: "Derecho",
          category: "Libros",
          course: "Derecho Constitucional",
        },
        {
          userId: users[5].id,
          title: "Cartón maqueta y materiales de corte",
          description:
            "Necesito retazos reutilizables para una maqueta de taller. También acepto una donación de sobrantes.",
          faculty: "Arquitectura",
          category: "Útiles de taller",
          course: "Taller 3",
        },
      ],
    });
    return true;
  });
  if (created)
    console.log(
      "Demo creada: 6 estudiantes, 6 materiales, 4 pedidos y una propuesta pendiente. Los usuarios existentes no se modificaron. Consulta las credenciales en README.md.",
    );
}
main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
