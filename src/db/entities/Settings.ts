import { Column, Entity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { Pool } from "./Pool";

@Entity()
export class Settings {
  @PrimaryGeneratedColumn()
  public id!: string;

  @ManyToOne(type => Pool, {nullable: true, onDelete: "SET NULL", eager: true})
  public currentPool!: Pool | null;
}
