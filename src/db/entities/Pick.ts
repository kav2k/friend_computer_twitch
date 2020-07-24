import { Column, Entity, Index, ManyToOne, Unique, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";
import { Pool } from "./Pool";

@Entity()
@Unique(["user", "pool"])
@Index(["user", "pool"], { unique: true })
export class Pick {
  @PrimaryGeneratedColumn()
  public id!: string;

  @ManyToOne(type => User, user => user.picks)
  public user!: User;

  @ManyToOne(type => Pool, pool => pool.picks)
  public pool!: Pool;

  @Column({nullable: true})
  public pickedDate?: Date;

  @Column({nullable: true})
  public pickedRemark?: string;
}
