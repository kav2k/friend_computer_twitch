import {MigrationInterface, QueryRunner} from "typeorm";

export class DefineCascadeDeletes1626033829177 implements MigrationInterface {
    name = 'DefineCascadeDeletes1626033829177'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pick" DROP CONSTRAINT "FK_68ea89acccda777b413d44818e1"`);
        await queryRunner.query(`ALTER TABLE "pick" DROP CONSTRAINT "FK_fc2639f2e2fc99314a5450988dc"`);
        await queryRunner.query(`ALTER TABLE "settings" DROP CONSTRAINT "FK_d9e6ebad266c0eb71cebf218515"`);
        await queryRunner.query(`ALTER TABLE "pick" ADD CONSTRAINT "FK_68ea89acccda777b413d44818e1" FOREIGN KEY ("userUsername") REFERENCES "user"("username") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pick" ADD CONSTRAINT "FK_fc2639f2e2fc99314a5450988dc" FOREIGN KEY ("poolName") REFERENCES "pool"("name") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "settings" ADD CONSTRAINT "FK_d9e6ebad266c0eb71cebf218515" FOREIGN KEY ("currentPoolName") REFERENCES "pool"("name") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "settings" DROP CONSTRAINT "FK_d9e6ebad266c0eb71cebf218515"`);
        await queryRunner.query(`ALTER TABLE "pick" DROP CONSTRAINT "FK_fc2639f2e2fc99314a5450988dc"`);
        await queryRunner.query(`ALTER TABLE "pick" DROP CONSTRAINT "FK_68ea89acccda777b413d44818e1"`);
        await queryRunner.query(`ALTER TABLE "settings" ADD CONSTRAINT "FK_d9e6ebad266c0eb71cebf218515" FOREIGN KEY ("currentPoolName") REFERENCES "pool"("name") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pick" ADD CONSTRAINT "FK_fc2639f2e2fc99314a5450988dc" FOREIGN KEY ("poolName") REFERENCES "pool"("name") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pick" ADD CONSTRAINT "FK_68ea89acccda777b413d44818e1" FOREIGN KEY ("userUsername") REFERENCES "user"("username") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
