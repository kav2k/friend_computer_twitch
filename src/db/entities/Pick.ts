import { Column, Entity, Index, ManyToOne, Unique, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";
import { Pool } from "./Pool";

@Entity()
@Unique(["user", "pool"])
@Index(["user", "pool"], { unique: true })
export class Pick {
  @PrimaryGeneratedColumn()
  public id!: string;

  @ManyToOne(type => User, user => user.picks, { onDelete: "CASCADE" })
  public user!: User;

  @ManyToOne(type => Pool, pool => pool.picks, { onDelete: "CASCADE" })
  public pool!: Pool;

  @Column({default: false})
  public picked!: boolean;

  @Column({nullable: true})
  public pickedDate?: Date;

  @Column({nullable: true})
  public pickedRemark?: string;

  @Column({default: false})
  public reserved!: boolean;

  @Column({nullable: true})
  public reservedDate?: Date;

  @Column({nullable: true, type: "varchar"})
  public customName!: string | null;
}
