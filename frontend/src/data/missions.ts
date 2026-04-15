export interface Mission {
  id: number;
  title: string;
  clue: string;
  locationHint: string;
  challenge: string;
  isSpicy: boolean;
}

export const missions: Mission[] = [
  {
    id: 1,
    title: "Exploradora da Praia",
    clue: "Toda aventura numa ilha começa onde a terra encontra o mar.",
    locationHint: "Uma praia bonita com vista para o oceano",
    challenge: "Tira uma selfie numa praia bonita com o oceano atrás de ti.",
    isSpicy: false,
  },
  {
    id: 2,
    title: "Caçadora de Cocos",
    clue: "Nesta ilha, o tesouro cresce bem acima da tua cabeça.",
    locationHint: "Um coqueiro ou barraquinha local",
    challenge: "Encontra um coco fresco ou uma barraquinha de cocos e tira uma foto.",
    isSpicy: false,
  },
  {
    id: 3,
    title: "Desbravadora da Selva",
    clue: "Deixa a praia e entra no selvagem.",
    locationHint: "Um trilho na selva ou caminho tropical",
    challenge: "Encontra um trilho na selva, plantas tropicais ou um caminho e tira uma foto lá.",
    isSpicy: false,
  },
  {
    id: 4,
    title: "Caçadora de Miradouros",
    clue: "Para entender uma ilha, tens de a ver de cima.",
    locationHint: "Um miradouro com vista para a ilha",
    challenge: "Chega a um miradouro e tira uma foto da paisagem da ilha.",
    isSpicy: false,
  },
  {
    id: 5,
    title: "Descoberta Local",
    clue: "A cultura de um lugar é saboreada antes de ser compreendida.",
    locationHint: "Um mercado local ou vendedor de rua",
    challenge: "Tira uma foto de um prato tailandês local ou comida de rua que descobrires.",
    isSpicy: false,
  },
  {
    id: 6,
    title: "Lugar Secreto",
    clue: "Os melhores lugares raramente são os mais movimentados.",
    locationHint: "Um cantinho tranquilo e secreto da ilha",
    challenge: "Encontra um lugar calmo ou escondido na ilha e tira uma foto.",
    isSpicy: false,
  },
  {
    id: 7,
    title: "Desafio Picante",
    clue: "A aventura é experimentar coisas novas… às vezes fora da tua zona de conforto.",
    locationHint: "Onde a tua coragem te levar",
    challenge: "Tira uma foto divertida ou ousada — saltar para a água, uma pose engraçada, um pequeno desafio seguro mas divertido.",
    isSpicy: true,
  },
  {
    id: 8,
    title: "Final Picante",
    clue: "O tesouro final aparece quando o sol desaparece… e o coração acelera.",
    locationHint: "Um lugar com pôr do sol na ilha",
    challenge: "Tira uma foto ao pôr do sol que seja divertida, atrevida ou ligeiramente ousada — uma silhueta, uma pose cheia de charme, algo memorável.",
    isSpicy: true,
  },
];
