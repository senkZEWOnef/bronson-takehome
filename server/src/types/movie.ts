/**
 * This represents the general type of a movie regardless
 * of where it comes from, local or third party.
 * will start simple but with room to grow
 */

export type Movie = {
  //unique identifier
  id: string;

  //movie title
  title: string;

  //release year
  year: number;

  // wheter movie comes from local sourse or third party
  source: "api" | "local";
};
