import { Column, Entity, PrimaryColumn, OneToMany } from "typeorm";
import { Pick } from "./Pick";

export enum PoolType {
  CLASSIC = "c",
  ACTIVE_ONLY = "a"
}

@Entity()
export class Pool {
  @PrimaryColumn()
  public name!: string;

  @Column({
    type: "enum",
    enum: PoolType,
    default: PoolType.CLASSIC
  })
  public type!: PoolType;

  @Column({default: false})
  public default!: boolean;

  @Column({default: true})
  public open!: boolean;

  @OneToMany(type => Pick, pick => pick.pool)
  public picks!: Pick[];
}
