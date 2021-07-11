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

  @Column({nullable: true, type: "varchar"})
  public displayName!: string | null;

  @Column({nullable: true, type: "varchar"})
  public validRegex!: string | null;

  @Column({nullable: true, type: "varchar"})
  public validRemark!: string | null;

  public get prettyName() {
    return this.displayName || this.name;
  }

  public validateName(candidate: string): boolean {
    if (this.validRegex) {
      try {
        const regex = new RegExp(this.validRegex);
        return regex.test(candidate);
      } catch (e) {
        console.error(e);
        return false;
      }
    } else {
      return true;
    }
  }

  public get allowsReservation(): boolean {
    return this.type == PoolType.CLASSIC;
  }
}
