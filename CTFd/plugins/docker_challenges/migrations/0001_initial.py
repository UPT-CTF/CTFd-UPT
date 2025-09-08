revision = "docker_dynamic_0001"
down_revision = None
branch_labels = None
depends_on = None

def upgrade(op=None):
    import sqlalchemy as sa
    
    # Create the docker_challenge table with all columns
    op.create_table(
        'docker_challenge',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('docker_image', sa.String(length=128), nullable=True),
        sa.Column('initial', sa.Integer(), nullable=True),
        sa.Column('minimum', sa.Integer(), nullable=True),
        sa.Column('decay', sa.Integer(), nullable=True),
        sa.Column('function', sa.String(length=32), nullable=True),
        sa.Column('connection_type', sa.String(length=16), nullable=True),
        sa.ForeignKeyConstraint(['id'], ['challenges.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create index on docker_image
    op.create_index(op.f('ix_docker_challenge_docker_image'), 'docker_challenge', ['docker_image'], unique=False)

def downgrade(op=None):
    op.drop_index(op.f('ix_docker_challenge_docker_image'), table_name='docker_challenge')
    op.drop_table('docker_challenge')
