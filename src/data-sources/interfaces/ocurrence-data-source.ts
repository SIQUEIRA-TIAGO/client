import { Ocurrence } from "@/entities/ocurrence";
import { OcurrenceData } from "@/entities/ocurrence-data";

export type IOccurenceDataSource = () => {
    postOcurrence: (ocurrence: Omit<Ocurrence, 'creation_date' | 'preview_message'> & {ocurrenceJson: OcurrenceData}) => Promise<void>;
}