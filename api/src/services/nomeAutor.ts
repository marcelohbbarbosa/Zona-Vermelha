import { randomInt } from "crypto";

// Países membros da ONU.
const PAISES = [
  "Afeganistão", "África do Sul", "Albânia", "Alemanha", "Andorra", "Angola", "Antígua e Barbuda", "Arábia Saudita", "Argélia", "Argentina", "Armênia", "Austrália", "Áustria", "Azerbaijão",
  "Bahamas", "Bahrein", "Bangladesh", "Barbados", "Belarus", "Bélgica", "Belize", "Benin", "Butão", "Bolívia", "Bósnia e Herzegovina", "Botsuana", "Brasil", "Brunei", "Bulgária", "Burkina Faso", "Burundi",
  "Cabo Verde", "Camarões", "Camboja", "Canadá", "Catar", "Cazaquistão", "Chade", "Chile", "China", "Chipre", "Colômbia", "Comores", "Congo", "Coreia do Norte", "Coreia do Sul", "Costa do Marfim", "Costa Rica", "Croácia", "Cuba",
  "Dinamarca", "Djibuti", "Dominica", "Egito", "El Salvador", "Emirados Árabes Unidos", "Equador", "Eritreia", "Eslováquia", "Eslovênia", "Espanha", "Estados Unidos", "Estônia", "Eswatini", "Etiópia",
  "Fiji", "Filipinas", "Finlândia", "França", "Gabão", "Gâmbia", "Gana", "Geórgia", "Granada", "Grécia", "Guatemala", "Guiana", "Guiné", "Guiné-Bissau", "Guiné Equatorial",
  "Haiti", "Honduras", "Hungria", "Iêmen", "Ilhas Marshall", "Ilhas Salomão", "Índia", "Indonésia", "Irã", "Iraque", "Irlanda", "Islândia", "Israel", "Itália", "Jamaica", "Japão", "Jordânia",
  "Kiribati", "Kuwait", "Laos", "Lesoto", "Letônia", "Líbano", "Libéria", "Líbia", "Liechtenstein", "Lituânia", "Luxemburgo", "Madagascar", "Malásia", "Malaui", "Maldivas", "Mali", "Malta", "Marrocos", "Maurício", "Mauritânia", "México", "Mianmar", "Micronésia", "Moçambique", "Moldávia", "Mônaco", "Mongólia", "Montenegro",
  "Namíbia", "Nauru", "Nepal", "Nicarágua", "Níger", "Nigéria", "Noruega", "Nova Zelândia", "Omã", "Países Baixos", "Palau", "Panamá", "Papua Nova Guiné", "Paquistão", "Paraguai", "Peru", "Polônia", "Portugal",
  "Quênia", "Quirguistão", "Reino Unido", "República Centro-Africana", "República Democrática do Congo", "República Dominicana", "República Tcheca", "Romênia", "Ruanda", "Rússia", "Samoa", "San Marino", "Santa Lúcia", "São Cristóvão e Névis", "São Tomé e Príncipe", "São Vicente e Granadinas", "Senegal", "Serra Leoa", "Sérvia", "Seychelles", "Singapura", "Síria", "Somália", "Sri Lanka", "Sudão", "Sudão do Sul", "Suécia", "Suíça", "Suriname",
  "Tailândia", "Tajiquistão", "Tanzânia", "Timor-Leste", "Togo", "Tonga", "Trinidad e Tobago", "Tunísia", "Turcomenistão", "Turquia", "Tuvalu", "Ucrânia", "Uganda", "Uruguai", "Uzbequistão", "Vanuatu", "Venezuela", "Vietnã", "Zâmbia", "Zimbábue", "Macedônia do Norte",
];

export function gerarNomeAutor(): string {
  const pais = PAISES[randomInt(PAISES.length)];
  const sequencia = String(randomInt(1000)).padStart(3, "0");
  return `${pais} ${sequencia}`;
}
