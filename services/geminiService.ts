
import { GoogleGenAI, Type } from "@google/genai";
// Fix: Import types from the centralized types.ts file
// Fix: Renamed AppContext to AppContextForAI to match the exported type from types.ts.
import { DocumentDocType, Document, Task, CalendarEvent, TaskStatus, VisitReportData, AppContextForAI } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export const analyzeDocumentForData = async (
  content: { text?: string; file?: { base64: string; mimeType: string; } }
): Promise<any> => {
  const model = 'gemini-2.5-flash';
  
  const prompt = `
    Analiza el siguiente documento (puede ser texto o una imagen) y extrae la siguiente información en formato JSON.
    - docNumber: El número de oficio, memorando, factura, o identificador principal del documento.
    - sender: La persona, empresa o departamento que envía el documento (remitente).
    - content: El título o asunto principal del documento, de forma muy específica y corta. Por ejemplo: "Factura de servicios eléctricos", "Informe de ventas Q2", "Solicitud de vacaciones", "Formulario de reporte de accidente del INS".
    - sentDate: La fecha en que se emitió o envió el documento (formato AAAA-MM-DD).
    - procedure: El trámite o acción que se solicita (ej: "Para pago", "Para su conocimiento", "Aprobar", etc.). Si no se especifica, déjalo en blanco.
    - folioCount: El número de páginas o folios que contiene el documento, si se menciona. Debe ser un número. Si no se menciona, devuelve 0.
    
    Si alguna información no está presente, devuelve un string vacío para esa clave (excepto folioCount que debe ser 0).
  `;
  
  const parts: any[] = [{ text: prompt }];

  if (content.text) {
    parts.push({ text: content.text });
  } else if (content.file) {
    parts.push({
      inlineData: {
        data: content.file.base64,
        mimeType: content.file.mimeType,
      },
    });
  } else {
    throw new Error('No content provided to analyze.');
  }

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      docNumber: { type: Type.STRING },
      sender: { type: Type.STRING },
      content: { type: Type.STRING },
      sentDate: { type: Type.STRING },
      procedure: { type: Type.STRING },
      folioCount: { type: Type.NUMBER },
    },
  };

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema,
      },
    });
    
    const jsonString = response.text.trim();
    return JSON.parse(jsonString);

  } catch (error) {
    console.error("Error analyzing document with Gemini:", error);
    throw new Error("No se pudo analizar el documento. Intente de nuevo.");
  }
};

export const generateLaborReportDraft = async (
  month: number, // 0-indexed
  year: number,
  documents: Document[],
  tasks: Task[],
  events: CalendarEvent[]
): Promise<any> => {
  const model = 'gemini-2.5-flash';
  
  const activitiesByDay: { [day: number]: string[] } = {};

  const processDate = (dateStr: string, activity: string) => {
    if (!dateStr) return;
    const d = new Date(dateStr + 'T00:00:00'); 
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!activitiesByDay[day]) activitiesByDay[day] = [];
      activitiesByDay[day].push(activity);
    }
  };

  documents.forEach(doc => {
    const date = doc.status === 'Entrante' ? doc.receivedDate : doc.stampDate;
    const activity = doc.status === 'Entrante' ? `Documento recibido de ${doc.sender}: ${doc.content}.` : `Documento enviado a ${doc.recipient}: ${doc.content}.`;
    processDate(date, activity);
  });
  tasks.forEach(task => {
    processDate(task.creationDate, `Tarea creada: "${task.title}".`);
    if (task.status === TaskStatus.Completada) {
       processDate(task.dueDate, `Tarea completada: "${task.title}".`);
    }
  });
  events.forEach(event => {
    processDate(event.date, `Participación en evento: "${event.title}" de ${event.startTime} a ${event.endTime}.`);
  });

  const formattedActivities = Object.entries(activitiesByDay)
    .map(([day, activities]) => `Día ${day}: \n- ${activities.join('\n- ')}`)
    .join('\n\n');
  
  if (!formattedActivities) {
      return [];
  }

  const prompt = `
    Eres un asistente de dirección experto. Tu tarea es generar un borrador para un "Informe de Labores" mensual basado en una lista de actividades.
    Resume y agrupa las actividades de cada día en un párrafo conciso y profesional en la columna "Actividad Ejecutada".
    Para la columna de observaciones, puedes añadir una observación genérica como "Sin observaciones" o "Gestión rutinaria" si no hay nada que destacar.
    La respuesta debe ser un array de objetos JSON, donde cada objeto representa una fila de la tabla y tiene las claves "day" (string), "activity" (string) y "observations" (string).
    
    Aquí está la lista de actividades del mes:
    ---
    ${formattedActivities}
    ---

    Genera el informe completo para todos los días con actividad. Para los días con actividad, genera una fila por día. El formato del día debe ser 'DD'.
  `;

  const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        day: { type: Type.STRING },
        activity: { type: Type.STRING },
        observations: { type: Type.STRING },
      },
      required: ['day', 'activity', 'observations'],
    },
  };

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema,
      },
    });
    
    const jsonString = response.text.trim();
    return JSON.parse(jsonString);

  } catch (error) {
    console.error("Error generating labor report draft:", error);
    throw new Error("No se pudo generar el borrador del informe. Verifique que haya actividades en el mes seleccionado.");
  }
};


export const generateLogEntrySuggestion = async (
  date: string, // YYYY-MM-DD
  documents: Document[],
  tasks: Task[],
  events: CalendarEvent[]
): Promise<string> => {
  const model = 'gemini-2.5-flash';
  
  const dailyActivities: string[] = [];

  documents.forEach(doc => {
    const docDate = doc.status === 'Entrante' ? doc.receivedDate : doc.stampDate;
    if (docDate === date) {
      dailyActivities.push(doc.status === 'Entrante' ? `Se recibió el documento '${doc.content}' de ${doc.sender}.` : `Se envió el documento '${doc.content}' a ${doc.recipient}.`);
    }
  });
  tasks.forEach(task => {
    if (task.creationDate === date) {
      dailyActivities.push(`Se creó la tarea: "${task.title}".`);
    }
    if (task.dueDate === date && task.status === TaskStatus.Completada) {
       dailyActivities.push(`Se completó la tarea: "${task.title}".`);
    }
  });
  events.forEach(event => {
    if (event.date === date) {
      dailyActivities.push(`Se asistió al evento: "${event.title}" (${event.startTime} - ${event.endTime}).`);
    }
  });

  if (dailyActivities.length === 0) {
    return "No se encontraron actividades registradas para este día. Puede describir la jornada manualmente.";
  }

  const formattedActivities = '- ' + dailyActivities.join('\n- ');
  
  const prompt = `
    Eres el asistente del director de una institución. Tu tarea es redactar una entrada para la bitácora diaria en prosa, de forma profesional y narrativa.
    Utiliza la siguiente lista de actividades del día para construir un párrafo coherente que resuma la jornada.

    Actividades del día:
    ---
    ${formattedActivities}
    ---

    Redacta la entrada de la bitácora.
  `;
  
  try {
    const response = await ai.models.generateContent({
        model,
        contents: prompt
    });
    return response.text;
  } catch (error) {
    console.error("Error generating log entry:", error);
    return "Error: No se pudo generar la sugerencia para la bitácora.";
  }
};

export const generateScheduleDraft = async (
  month: number, // 0-indexed
  year: number,
  existingSchedule: { [key: string]: string }
): Promise<{ [key: string]: string }> => {
  const model = 'gemini-2.5-flash';
  
  const monthName = new Date(year, month).toLocaleString('es-ES', { month: 'long' });
  const sampleData = JSON.stringify(existingSchedule, null, 2);

  const prompt = `
    Eres un asistente de dirección altamente eficiente, experto en planificación y optimización de calendarios.
    Tu tarea es generar un borrador de la programación mensual para ${monthName} de ${year}.

    Analiza los datos de programaciones anteriores que te proporciono a continuación:
    ---
    ${sampleData}
    ---

    Tu análisis debe seguir estos pasos:
    1.  Identifica las actividades claramente recurrentes. Estas son tareas que se repiten semanalmente o en fechas fijas, como "Revisión de correos electrónicos y gestión de trámites", "Planificación semanal", "Gestión de compras CNP", "Reunión con la Junta de Educación".
    2.  Identifica las actividades que son específicas y NO recurrentes. Estas son eventos únicos como "Visita a docente: Susana García", "Día de las Culturas", "Reunión de directores", "Reunión con el comité de apoyo educativo".
    3.  Crea una nueva programación para el mes y año solicitados (${monthName} de ${year}).
    4.  Pobla el nuevo calendario ÚNICAMENTE con las actividades recurrentes que identificaste. Asigna estas actividades a los días apropiados (por ejemplo, la planificación semanal debería ir los lunes). Sé inteligente al distribuir las tareas a lo largo de la semana.
    5.  NO incluyas las actividades no recurrentes en el nuevo borrador. Esos espacios deben quedar vacíos para que el director los llene manualmente.
    
    El resultado debe ser un objeto JSON. Las claves deben ser las fechas del mes solicitado en formato "YYYY-MM-DD", y los valores deben ser las descripciones de las actividades para ese día. Solo incluye los días que tienen actividades. No incluyas fines de semana (sábados y domingos).
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });
    
    const jsonString = response.text.trim();
    const cleanedJsonString = jsonString.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(cleanedJsonString);

  } catch (error) {
    console.error("Error generating schedule draft:", error);
    throw new Error("No se pudo generar el borrador de la programación. La IA no pudo identificar patrones recurrentes.");
  }
};

export const parseActivitiesFromText = async (text: string): Promise<string[]> => {
  const model = 'gemini-2.5-flash';
  const prompt = `
    Analiza el siguiente texto, que describe las actividades de un día en una oficina.
    Identifica y separa cada actividad individual en una lista.
    El resultado debe ser un array de strings en formato JSON, donde cada string es una actividad distinta.

    Texto a analizar:
    ---
    ${text}
    ---

    Ejemplo de salida:
    ["Revisión de correos electrónicos y gestión de trámites.", "Atención a imprevistos y consultas.", "Visita a docente: Susana García."]
  `;

  const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.STRING,
    },
  };

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema,
      },
    });
    
    const jsonString = response.text.trim();
    return JSON.parse(jsonString);

  } catch (error) {
    console.error("Error parsing activities:", error);
    throw new Error("La IA no pudo procesar las actividades del día.");
  }
};

export const analyzeVisitSheets = async (files: { base64: string, mimeType: string }[]): Promise<VisitReportData> => {
    const model = 'gemini-2.5-flash';

    const prompt = `
        Eres un asistente administrativo experto en analizar informes de visitas educativas.
        Tu tarea es procesar de 1 a 6 archivos de "hojas de visita" (imágenes o texto) y consolidar toda la información en un único "Informe de Visitas" estructurado.

        Sigue estos pasos CUIDADOSAMENTE:
        1.  **Tabla de Resumen (summaryRows):** Por cada visita individual que identifiques en los archivos, crea un objeto para ella y extrae:
            -   \`level\`: El nivel o asignatura (Ej: "Quinto", "Primero").
            -   \`officialName\`: El nombre del funcionario visitado.
            -   \`plannedVisits\`: El número de visitas programadas (si se menciona).
            -   \`actualVisits\`: El número de visitas realizadas (si se menciona).
        2.  **Resultados Principales (principalResults):** Lee todos los informes. Sintetiza los hallazgos y resultados comunes en un solo texto. Usa viñetas (•) para listar los puntos clave (Ej: ambiente en el aula, respuesta de los estudiantes).
        3.  **Recomendaciones (recommendations):** Agrupa todas las recomendaciones de todos los informes en una única lista numerada (1., 2., 3., ...).
        4.  **Plazos de Recomendaciones (recommendationDeadlines):** Si se mencionan plazos específicos para las recomendaciones, extráelos.
        5.  **Acciones de Seguimiento (followUpActions):** Extrae cualquier acción de seguimiento prevista.
        6.  **Plazos de Seguimiento (followUpDeadlines):** Extrae los plazos para las acciones de seguimiento (Ej: "Noviembre").

        El resultado final DEBE ser un único objeto JSON con la estructura exacta que se define en el esquema.
    `;
    
    const parts: any[] = [{ text: prompt }];
    files.forEach(file => {
        parts.push({
            inlineData: {
                data: file.base64,
                mimeType: file.mimeType,
            },
        });
    });

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            summaryRows: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        level: { type: Type.STRING },
                        officialName: { type: Type.STRING },
                        plannedVisits: { type: Type.STRING },
                        actualVisits: { type: Type.STRING },
                    },
                    required: ['id', 'level', 'officialName', 'plannedVisits', 'actualVisits']
                }
            },
            principalResults: { type: Type.STRING },
            recommendations: { type: Type.STRING },
            recommendationDeadlines: { type: Type.STRING },
            followUpActions: { type: Type.STRING },
            followUpDeadlines: { type: Type.STRING },
        },
        required: ['summaryRows', 'principalResults', 'recommendations', 'recommendationDeadlines', 'followUpActions', 'followUpDeadlines']
    };

    try {
        const response = await ai.models.generateContent({
            model,
            contents: { parts },
            config: {
                responseMimeType: "application/json",
                responseSchema,
            },
        });

        const jsonString = response.text.trim();
        const parsedData = JSON.parse(jsonString);
        
        // Gemini might not generate the 'id' field, so let's add it.
        if (parsedData.summaryRows) {
            parsedData.summaryRows = parsedData.summaryRows.map((row: any, index: number) => ({
                ...row,
                id: `ai-vr-${Date.now()}-${index}`
            }));
        }

        return parsedData;

    } catch (error) {
        console.error("Error analyzing visit sheets:", error);
        throw new Error("La IA no pudo procesar los informes de visita. Verifique los archivos y vuelva a intentarlo.");
    }
};

export const generateTaskFromPrompt = async (prompt: string): Promise<{ title: string; description: string; dueDate: string; }> => {
    const model = 'gemini-2.5-flash';
    const fullPrompt = `
        Analiza la siguiente solicitud del usuario y extrae los detalles para crear una tarea. Tu objetivo es devolver un objeto JSON.
        - title: Un título corto y conciso para la tarea (máximo 10 palabras).
        - description: Una descripción más detallada de lo que se necesita hacer.
        - dueDate: La fecha de vencimiento en formato AAAA-MM-DD. Si se menciona un día relativo como "mañana", "el próximo viernes", o "en dos semanas", calcula la fecha correspondiente. La fecha de hoy es ${new Date().toISOString().split('T')[0]}.

        Solicitud del usuario: "${prompt}"

        Genera el objeto JSON con las claves "title", "description", y "dueDate".
    `;
    
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            dueDate: { type: Type.STRING },
        },
        required: ['title', 'description', 'dueDate'],
    };

    try {
        const response = await ai.models.generateContent({
            model,
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema,
            },
        });
        const jsonString = response.text.trim();
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Error generating task from prompt:", error);
        throw new Error("La IA no pudo generar la tarea. Intente ser más específico en su solicitud.");
    }
};

export const generateTaskFromFile = async (file: { base64: string, mimeType: string }): Promise<{ title: string; description: string; dueDate: string; }> => {
    const model = 'gemini-2.5-flash';
    const prompt = `
        Eres un asistente administrativo experto en crear tareas a partir de documentos.
        Analiza el siguiente documento adjunto (puede ser una imagen o PDF).
        Tu objetivo es extraer la información necesaria para crear una tarea y devolver un objeto JSON.

        1.  **title**: Crea un título corto, claro y accionable para la tarea (ej: "Pagar factura de electricidad", "Revisar informe de ventas", "Firmar contrato de servicio").
        2.  **description**: Proporciona una descripción más detallada de la tarea, resumiendo los puntos clave del documento.
        3.  **dueDate**: Extrae la fecha de vencimiento del documento en formato AAAA-MM-DD. Si no se menciona una fecha explícita, sugiere una fecha razonable (ej: 7 días a partir de hoy). La fecha de hoy es ${new Date().toISOString().split('T')[0]}.

        Genera el objeto JSON con las claves "title", "description", y "dueDate".
    `;

    const parts = [
        { text: prompt },
        { inlineData: { data: file.base64, mimeType: file.mimeType } }
    ];

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            dueDate: { type: Type.STRING },
        },
        required: ['title', 'description', 'dueDate'],
    };

    try {
        const response = await ai.models.generateContent({
            model,
            contents: { parts },
            config: {
                responseMimeType: "application/json",
                responseSchema,
            },
        });
        const jsonString = response.text.trim();
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Error generating task from file:", error);
        throw new Error("La IA no pudo procesar el archivo para generar la tarea.");
    }
};

export const getGlobalAIResponse = async (query: string, context: AppContextForAI): Promise<ReadableStream<string>> => {
    const model = 'gemini-2.5-flash';
    
    // Simple serialization of context. In a real app, you'd be more selective.
    const contextString = `
      Tasks: ${JSON.stringify(context.tasks, null, 2)}
      Events: ${JSON.stringify(context.events, null, 2)}
      Documents: ${JSON.stringify(context.documents, null, 2)}
      Files: ${JSON.stringify(context.files.map(f => ({ name: f.name, id: f.id })), null, 2)}
      Folders: ${JSON.stringify(context.folders.map(f => ({ name: f.name, id: f.id })), null, 2)}
    `;

    const prompt = `
      You are Nexus, the integrated AI assistant for the Nexus OS application.
      Your purpose is to help the user understand and manage their office data by answering questions based ONLY on the context provided below.
      Do not invent information. If the answer is not in the context, say that you don't have that information.
      Be concise and helpful. Format your answers clearly, using markdown for lists, bold text, etc.

      Today's date is: ${new Date().toLocaleDateString('es-ES')}

      Here is the current state of the application:
      ---
      CONTEXT:
      ${contextString}
      ---

      Now, please answer the following user question:

      USER QUESTION:
      "${query}"
    `;

    try {
        const result = await ai.models.generateContentStream({
            model,
            contents: prompt
        });
        
        const stream = new ReadableStream({
            async start(controller) {
                for await (const chunk of result) {
                    controller.enqueue(chunk.text);
                }
                controller.close();
            }
        });

        return stream;

    } catch (error) {
        console.error("Error with Global AI Assistant:", error);
        throw new Error("El asistente de IA no pudo procesar su solicitud.");
    }
};
