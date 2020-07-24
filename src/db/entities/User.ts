import { Column, Entity, Index, PrimaryColumn, OneToMany } from "typeorm";
import { Pick } from "./Pick";

@Entity()
export class User {
  @PrimaryColumn()
  public username!: string;

  @Column()
  public nickname!: string;

  @Column({nullable: true})
  public id?: number;

  @Index()
  @Column({nullable: true})
  public lastActive?: Date;

  @Column({default: false})
  public picked!: boolean;

  @Column({nullable: true})
  public pickedDate?: Date;

  @Column({nullable: true})
  public pickedRemark?: string;

  @Column({default: false})
  public reserved!: boolean;

  @Column({default: true})
  public eligible!: boolean;

  @Column({nullable: true, type: "varchar"})
  public customName!: string | null;

  @OneToMany(type => Pick, pick => pick.user)
  public picks!: Pick[];
}
