/**
 * Represents the normalized Movie type,
 * regardless of whether the data comes from a local source
 * or a third-party API.
 *
 * Designed to be simple, with room to grow.
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
