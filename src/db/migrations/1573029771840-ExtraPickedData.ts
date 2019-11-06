import {MigrationInterface, QueryRunner} from "typeorm";

export class ExtraPickedData1573029771840 implements MigrationInterface {
    name = 'ExtraPickedData1573029771840'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "user" ADD "pickedDate" TIMESTAMP`, undefined);
        await queryRunner.query(`ALTER TABLE "user" ADD "pickedRemark" character varying`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_e4c0b3aa1e42886021a2778499" ON "user" ("lastActive") `, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP INDEX "IDX_e4c0b3aa1e42886021a2778499"`, undefined);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "pickedRemark"`, undefined);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "pickedDate"`, undefined);
    }

}
